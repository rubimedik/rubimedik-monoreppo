#!/bin/bash
pkill -9 rm || true
cd apps/api
npx nest g module modules/wallet --no-spec
npx nest g controller modules/wallet --no-spec
npx nest g service modules/wallet --no-spec

npx nest g module modules/consultations --no-spec
npx nest g controller modules/consultations --no-spec
npx nest g service modules/consultations --no-spec

npx nest g module modules/blood-donations --no-spec
npx nest g controller modules/blood-donations --no-spec
npx nest g service modules/blood-donations --no-spec

npx nest g module modules/referrals --no-spec
npx nest g controller modules/referrals --no-spec
npx nest g service modules/referrals --no-spec

npx nest g module modules/chat --no-spec
npx nest g controller modules/chat --no-spec
npx nest g service modules/chat --no-spec

npx nest g controller modules/users --no-spec

mkdir -p src/modules/users/entities
mkdir -p src/modules/wallet/entities
mkdir -p src/modules/consultations/entities
mkdir -p src/modules/blood-donations/entities
mkdir -p src/modules/referrals/entities
mkdir -p src/modules/chat/entities

mv -f src/entities/user.entity.ts src/modules/users/entities/ || true
mv -f src/entities/specialist-profile.entity.ts src/modules/users/entities/ || true

mv -f src/entities/wallet.entity.ts src/modules/wallet/entities/ || true
mv -f src/entities/transaction.entity.ts src/modules/wallet/entities/ || true

mv -f src/entities/consultation.entity.ts src/modules/consultations/entities/ || true
mv -f src/entities/appointment.entity.ts src/modules/consultations/entities/ || true

mv -f src/entities/blood-request.entity.ts src/modules/blood-donations/entities/ || true
mv -f src/entities/donation-match.entity.ts src/modules/blood-donations/entities/ || true

mv -f src/entities/referral.entity.ts src/modules/referrals/entities/ || true
mv -f src/entities/referral-code.entity.ts src/modules/referrals/entities/ || true

mv -f src/entities/chat-room.entity.ts src/modules/chat/entities/ || true
mv -f src/entities/message.entity.ts src/modules/chat/entities/ || true

rm -rf src/entities
