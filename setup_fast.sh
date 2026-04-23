#!/bin/bash
set -e
cd apps/api
NEST="./node_modules/.bin/nest"

# Scaffold modules if they don't exist
if [ ! -d "src/modules/wallet/entities" ]; then
    $NEST g module modules/wallet --no-spec || true
    $NEST g controller modules/wallet --no-spec || true
    $NEST g service modules/wallet --no-spec || true
fi

if [ ! -d "src/modules/consultations" ]; then
    $NEST g module modules/consultations --no-spec || true
    $NEST g controller modules/consultations --no-spec || true
    $NEST g service modules/consultations --no-spec || true
fi

if [ ! -d "src/modules/blood-donations" ]; then
    $NEST g module modules/blood-donations --no-spec || true
    $NEST g controller modules/blood-donations --no-spec || true
    $NEST g service modules/blood-donations --no-spec || true
fi

if [ ! -d "src/modules/referrals" ]; then
    $NEST g module modules/referrals --no-spec || true
    $NEST g controller modules/referrals --no-spec || true
    $NEST g service modules/referrals --no-spec || true
fi

if [ ! -d "src/modules/chat" ]; then
    $NEST g module modules/chat --no-spec || true
    $NEST g controller modules/chat --no-spec || true
    $NEST g service modules/chat --no-spec || true
fi

if [ ! -f "src/modules/users/users.controller.ts" ]; then
    $NEST g controller modules/users --no-spec || true
fi

echo "Scaffolding done. Creating directories."

mkdir -p src/modules/users/entities
mkdir -p src/modules/wallet/entities
mkdir -p src/modules/consultations/entities
mkdir -p src/modules/blood-donations/entities
mkdir -p src/modules/referrals/entities
mkdir -p src/modules/chat/entities

echo "Moving files."

# Use mv and swallow errors if files are already moved or missing (e.g. from previous partial run)
mv src/entities/user.entity.ts src/modules/users/entities/ 2>/dev/null || true
mv src/entities/specialist-profile.entity.ts src/modules/users/entities/ 2>/dev/null || true
mv src/entities/referral-code.entity.ts src/modules/users/entities/ 2>/dev/null || true

mv src/entities/wallet.entity.ts src/modules/wallet/entities/ 2>/dev/null || true
mv src/entities/transaction.entity.ts src/modules/wallet/entities/ 2>/dev/null || true

mv src/entities/consultation.entity.ts src/modules/consultations/entities/ 2>/dev/null || true
mv src/entities/appointment.entity.ts src/modules/consultations/entities/ 2>/dev/null || true

mv src/entities/blood-request.entity.ts src/modules/blood-donations/entities/ 2>/dev/null || true
mv src/entities/donation-match.entity.ts src/modules/blood-donations/entities/ 2>/dev/null || true

mv src/entities/referral.entity.ts src/modules/referrals/entities/ 2>/dev/null || true

mv src/entities/chat-room.entity.ts src/modules/chat/entities/ 2>/dev/null || true
mv src/entities/message.entity.ts src/modules/chat/entities/ 2>/dev/null || true

rm -rf src/entities

echo "Complete."
