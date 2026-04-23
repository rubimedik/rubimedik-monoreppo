import { api } from './api';

export interface BloodRequest {
  id: string;
  title: string;
  hospital: {
    id: string;
    fullName: string;
    hospitalProfile?: {
        hospitalName: string;
        address: string;
    };
  };
  bloodType: string;
  donationType: string;
  units: number;
  unitsFulfilled: number;
  reason: string;
  urgency: string;
  status: string;
  createdAt: string;
}

export interface Review {
  id: string;
  hospitalId: string;
  requestId: string;
  donorId: string;
  donorName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalRating {
  averageRating: number;
  totalReviews: number;
}

export interface DonationMatch {
  id: string;
  request: BloodRequest;
  donor: {
    id: string;
    fullName: string;
  };
  status: string;
  scheduledDate?: string;
  donatedAt?: string;
  createdAt: string;
  units?: number;
  isAnonymous?: boolean;
  donationType?: string;
  declineReason?: string;
}

export interface DonorEligibility {
  isEligible: boolean;
  lastDonationType: string | null;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  daysRemaining: number;
}

export interface DonorStats {
  donationCount: number;
  unitsDonated: number;
  livesSaved: number;
  points: number;
  lastDonationDate: string | null;
}

export const donationService = {
  getRequests: async () => {
    const response = await api.get<BloodRequest[]>('/donations/requests');
    return response.data;
  },

  getRequestById: async (id: string) => {
    const response = await api.get<BloodRequest>(`/donations/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: Partial<BloodRequest>) => {
    const response = await api.post<BloodRequest>('/donations/requests', data);
    return response.data;
  },

  updateRequest: async (id: string, data: Partial<BloodRequest>) => {
    const response = await api.patch<BloodRequest>(`/donations/requests/${id}`, data);
    return response.data;
  },

  deleteRequest: async (id: string) => {
    await api.delete(`/donations/requests/${id}`);
  },

  bookDonation: async (requestId: string, scheduledDate?: Date) => {
    const response = await api.post<DonationMatch>('/donations/book', { 
        requestId, 
        scheduledDate 
    });
    return response.data;
  },

  cancelDonation: async (matchId: string) => {
    await api.delete(`/donations/matches/${matchId}`);
  },

  rescheduleDonation: async (matchId: string, scheduledDate: Date) => {
    const response = await api.put<DonationMatch>(`/donations/matches/${matchId}/reschedule`, { 
        scheduledDate 
    });
    return response.data;
  },

  updateMatchStatus: async (matchId: string, status: string, declineReason?: string) => {
    const response = await api.put<DonationMatch>(`/donations/matches/${matchId}/status`, { status, declineReason });
    return response.data;
  },

  completeDonation: async (matchId: string, unitsDonated?: number) => {
    const response = await api.post<DonationMatch>(`/donations/complete/${matchId}`, { unitsDonated });
    return response.data;
  },

  getDonorDonations: async (donorId: string) => {
    const response = await api.get<DonationMatch[]>(`/donations/donor/${donorId}`);
    return response.data;
  },

  getMyDonations: async () => {
    const response = await api.get<DonationMatch[]>('/donations/my');
    return response.data;
  },

  getHospitalMatches: async () => {
    const response = await api.get<DonationMatch[]>('/donations/hospital/matches');
    return response.data;
  },

  recordDonation: async (data: any) => {
    const response = await api.post<DonationMatch>('/donations/record', data);
    return response.data;
  },

  getDonorStats: async () => {
    const response = await api.get<DonorStats>('/donations/donor-stats');
    return response.data;
  },

  getEligibility: async () => {
    const response = await api.get<DonorEligibility>('/donations/eligibility');
    return response.data;
  },

  getAllRequests: async () => {
    const response = await api.get<BloodRequest[]>('/donations/requests');
    return response.data;
  },

  // Review APIs
  createReview: async (data: { requestId: string; hospitalId: string; rating: number; comment: string; isAnonymous?: boolean }) => {
    const response = await api.post<Review>('/donations/feedback', data);
    return response.data;
  },

  updateReview: async (reviewId: string, data: { rating: number; comment: string }) => {
    const response = await api.patch<Review>(`/donations/feedback/${reviewId}`, data);
    return response.data;
  },

  getRequestReviews: async (requestId: string) => {
    const response = await api.get<Review[]>(`/donations/requests/${requestId}/feedback`);
    return response.data;
  },

  getHospitalReviews: async (hospitalId: string) => {
    const response = await api.get<Review[]>(`/hospitals/${hospitalId}/reviews`);
    return response.data;
  },

  getHospitalRating: async (hospitalId: string) => {
    const response = await api.get<HospitalRating>(`/hospitals/${hospitalId}/rating`);
    return response.data;
  },

  getMyReviewForRequest: async (requestId: string) => {
    try {
      const response = await api.get<Review | null>(`/donations/requests/${requestId}/my-review`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
