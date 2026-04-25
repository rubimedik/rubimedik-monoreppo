import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SpecialistsService } from '../specialists/specialists.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiChat } from './entities/ai-chat.entity';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    @InjectRepository(AiChat)
    private aiChatRepository: Repository<AiChat>,
    private configService: ConfigService,
    private specialistsService: SpecialistsService
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async checkSymptoms(symptoms: string) {
    try {
      const prompt = `You are a medical triage assistant. Analyze these symptoms: ${symptoms}. Return ONLY a valid JSON object with the following structure: { "summary": "string", "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", "recommendation": "string", "specialists": ["string"] }. Do not include any markdown or text outside the JSON.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Basic cleaning in case Gemini includes markdown blocks
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to analyze symptoms: ' + error.message);
    }
  }

  async matchSpecialist(symptoms: string) {
    try {
      const specialists = await this.specialistsService.findAll();
      const specData = specialists.map(s => ({ id: s.id, specialty: s.specialty, name: (s.user as any)?.fullName }));

      const prompt = `You are a medical matching assistant. Given the patient symptoms and a list of available specialists, return ONLY a valid JSON array of specialist IDs that are the best match. Do not include any markdown. Specialists: ${JSON.stringify(specData)}. Symptoms: ${symptoms}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const matchedIds = JSON.parse(text);
      
      return specialists.filter(s => matchedIds.includes(s.id));
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to match specialist: ' + error.message);
    }
  }

  async getHealthTips(profileData: any) {
    try {
      const prompt = `You are a health coach. Generate 3 personalized weekly health tips based on this user profile: ${JSON.stringify(profileData)}. Return ONLY a valid JSON object containing an array of 3 tips. Format: { "tips": ["string"] }. Do not include markdown.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to generate health tips: ' + error.message);
    }
  }

  async chat(userId: string, message: string) {
    try {
      const prompt = `You are a helpful multilingual medical assistant for Rubimedik. You can answer in English and Nigerian Pidgin. Provide concise, helpful FAQ responses. User message: ${message}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text().trim();

      // Persist the chat
      const chat = this.aiChatRepository.create({
          user: { id: userId } as any,
          message,
          response: reply
      });
      await this.aiChatRepository.save(chat);
      
      return { reply };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to get chat response: ' + error.message);
    }
  }

  async getHistory(userId: string) {
      return this.aiChatRepository.find({
          where: { user: { id: userId } },
          order: { createdAt: 'ASC' },
          take: 50
      });
  }

  async generateConsultationSummary(chatHistory: string) {
    try {
      const prompt = `Analyze the following doctor-patient chat history and provide a structured clinical summary. 
      Return ONLY a valid JSON object:
      {
        "diagnosis": "Brief diagnosis or suspected condition",
        "advice": "Bulleted list of advice given",
        "prescription": "Medications and dosages if mentioned, else 'None'",
        "followUp": "Yes/No and timeframe if mentioned"
      }
      Chat History:
      ${chatHistory}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error: any) {
      this.logger.error('AI Summary failed: ' + error.message);
      return null;
    }
  }

  private readonly logger = new Logger(AiService.name);

  async analyzeReviewSentiment(reviewText: string) {
    try {
      const prompt = `Analyze this patient review for a medical consultation. 
      Return ONLY a valid JSON object:
      {
        "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
        "tags": ["string"],
        "shouldFlag": boolean
      }
      Review: "${reviewText}"
      Common tags: [unprofessional, rushed, poor_communication, helpful, detailed, late, excellent]
      Flag if there are serious professional concerns or very negative sentiment.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
        return { sentiment: 'NEUTRAL', tags: [], shouldFlag: false };
    }
  }

  async predictBloodInventory(historicalData: any, availableDonorsCount: number, bloodType: string) {
      try {
          const prompt = `Analyze this hospital's blood usage history: ${JSON.stringify(historicalData)}. 
          Based on the usage rate, predict when the ${bloodType} stock will run critically low.
          There are currently ${availableDonorsCount} eligible ${bloodType} donors within 10km.
          Return ONLY a valid JSON object:
          {
             "daysRemaining": number,
             "alertMessage": "A concise alert message (e.g. Based on your current usage rate, ${bloodType} stock will run critically low in approximately X days. There are Y eligible ${bloodType} donors within 10km — send urgent request?)"
          }`;

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error: any) {
          this.logger.error('Inventory Prediction failed: ' + error.message);
          return null;
      }
  }

  async classifyUrgency(description: string) {
      try {
          const prompt = `Analyze this blood request description: "${description}".
          Classify the urgency of the request.
          Return ONLY a valid JSON object:
          {
              "urgency": "CRITICAL" | "URGENT" | "NORMAL"
          }`;

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { urgency: 'NORMAL' };
      }
  }

  async rankDonors(requestDetails: any, donors: any[]) {
      try {
          // If too few donors, no need to ask AI
          if (donors.length <= 5) return donors.map(d => d.id);

          const prompt = `You are a Smart Donor Matching AI.
          A hospital posted a blood request: ${JSON.stringify(requestDetails)}.
          Here are the available donors: ${JSON.stringify(donors.map(d => ({ id: d.id, distance: d.distance, lastDonationDaysAgo: d.lastDonationDaysAgo, responseRate: d.responseRate }))) }.
          Rank the available donors based on distance, time since last donation (eligibility > 56 days for whole blood), past response rate, and the urgency of the request.
          Return ONLY a valid JSON array of the top 5 donor IDs that are most likely to respond and are eligible.
          Format: ["uuid1", "uuid2", ...]`;

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          this.logger.error('Donor Ranking failed: ' + error.message);
          // Fallback to top 5 based on whatever order they came in
          return donors.slice(0, 5).map(d => d.id);
      }
  }

  async detectFraud(hospitalHistory: any[]) {
      try {
          const prompt = `Analyze this hospital's recent blood request history to detect suspicious behaviour or abuse.
          History: ${JSON.stringify(hospitalHistory)}.
          Flag if:
          - Same hospital posts identical requests repeatedly in a short time.
          - Requests are never fulfilled or acknowledged.
          - Request volume spikes unusually.
          Return ONLY a valid JSON object:
          {
             "isFraudulent": boolean,
             "reason": "Brief reason if fraudulent, else empty string"
          }`;

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          this.logger.error('Fraud Detection failed: ' + error.message);
          return { isFraudulent: false, reason: '' };
      }
  }

  // --- NEW DONOR FEATURES ---

  async analyzeDonorBurnout(donationHistory: any[]) {
      try {
          const prompt = `Analyze this donor's donation history: ${JSON.stringify(donationHistory)}.
          Flag if they are over-donating or approaching health risk thresholds (e.g., donating whole blood more than 3 times in 4 months).
          Return ONLY a valid JSON object:
          {
             "isBurnoutRisk": boolean,
             "warningMessage": "A friendly, supportive warning message recommending a break if at risk, else empty string."
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { isBurnoutRisk: false, warningMessage: '' };
      }
  }

  async getBloodTypeRarity(bloodType: string, activeDonorsCount: number, location: string = 'Nigeria') {
      try {
          const prompt = `Generate a personalized rarity awareness message for a blood donor with type ${bloodType}.
          Context: There are currently ${activeDonorsCount} active ${bloodType} donors in ${location}.
          Make it sound appreciative and highlight how rare their blood type is and how crucial their next donation could be.
          Return ONLY a valid JSON object:
          {
             "rarityMessage": "The supportive message"
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { rarityMessage: `Your ${bloodType} blood is highly valuable to patients in need.` };
      }
  }

  async generatePreDonationPrep() {
      try {
          const prompt = `Generate a pre-donation preparation coach checklist for 24 hours before a blood donation.
          Format as a clean, engaging text block (no markdown code blocks, but bullet points are fine).
          Include 'Tonight' (water, iron-rich meals, no alcohol, sleep) and 'Morning of donation' (light breakfast, ID, short sleeves).`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
      } catch (error) {
          return "Drink extra water, eat an iron-rich meal, and get good sleep tonight. Tomorrow, eat a light breakfast and bring your ID.";
      }
  }

  async generatePostDonationRecovery() {
      try {
          const prompt = `Generate a 48-hour post-blood-donation recovery tracker/guide.
          Format as a clean, engaging text block (bullet points are fine).
          Include guidelines for Hour 0-4, Hour 4-24, Day 2, and Day 3.`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
      } catch (error) {
          return "Keep your bandage on for 4 hours, drink extra fluids, and avoid heavy lifting today.";
      }
  }

  async analyzeHealthQuestionnaire(questionnaireHistory: any[]) {
      try {
          const prompt = `Analyze this donor's recent health questionnaire responses and hospital feedback: ${JSON.stringify(questionnaireHistory)}.
          Flag any inconsistencies (e.g., answering "No" to illness, but hospital flagged their blood).
          Return ONLY a valid JSON object:
          {
             "hasAnomaly": boolean,
             "flagReason": "Brief reason if anomaly detected, else empty string."
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { hasAnomaly: false, flagReason: '' };
      }
  }

  async generateCommunityImpact(stats: any) {
      try {
          const prompt = `Generate a monthly personalized community impact summary for a blood donor based on these stats: ${JSON.stringify(stats)}.
          Make it uplifting and inspiring.
          Return ONLY a valid JSON object:
          {
             "impactSummary": "The summary text"
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { impactSummary: "Thank you for your life-saving contributions this month!" };
      }
  }

  async generateReengagementMessage(donorData: any) {
      try {
          const prompt = `Write a personalized re-engagement message (max 3 sentences) for a lapsed blood donor named ${donorData.name}.
          Context: It's been ${donorData.monthsSinceLast} months since their last donation. They have blood type ${donorData.bloodType}.
          Make it specific, urgent, but not guilt-tripping. Let them know hospitals near them need their blood type.
          Return ONLY a valid JSON object:
          {
             "message": "The message text"
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { message: "It's been a while since your last donation. We'd love to see you back!" };
      }
  }

  // --- NEW FRAUD DETECTION FEATURES ---

  async detectOffPlatformSolicitation(messagesText: string) {
      try {
          const prompt = `Scan these consultation messages for off-platform solicitation:
          "${messagesText}"
          Flag if they contain: phone numbers, WhatsApp references, external payment apps (Opay, Palmpay), or phrases like "contact me directly".
          Return ONLY a valid JSON object:
          {
             "isSoliciting": boolean,
             "reason": "Brief reason if true"
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { isSoliciting: false, reason: '' };
      }
  }

  async detectGhostConsultation(consultationData: any) {
      try {
          const prompt = `Analyze this consultation metadata: ${JSON.stringify(consultationData)}.
          Check for "Ghost Consultation" patterns where a specialist marks it complete without actually providing service.
          Rules:
          - If isEarlyCompletion is true, DO NOT flag simply because hasPatientFeedback is false (it's too early).
          - Flag if duration is < 3 mins AND zero messages exist.
          - Flag if duration is < 1 min regardless of messages.
          - Return isGhost: false if there are more than 5 messages regardless of duration.
          Return ONLY a valid JSON object:
          {
             "isGhost": boolean,
             "reason": "Brief explanation if true"
          }`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
      } catch (error) {
          return { isGhost: false, reason: '' };
      }
  }
}
