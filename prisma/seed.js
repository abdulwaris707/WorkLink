const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WorkLink database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo Client
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@worklink.com',
      passwordHash,
      name: 'Jessica Reynolds',
      role: 'CLIENT',
      phone: '+1 (555) 234-5678',
      location: 'Downtown Seattle, WA',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      clientProfile: {
        create: {
          phone: '+1 (555) 234-5678',
          location: 'Downtown Seattle, WA',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        },
      },
    },
  });

  // 2. Worker 1: Marcus Vance (Electrician)
  const worker1 = await prisma.user.create({
    data: {
      email: 'marcus@worklink.com',
      passwordHash,
      name: 'Marcus Vance',
      role: 'WORKER',
      phone: '+1 (555) 890-1234',
      location: 'Greater Seattle Area, WA',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      workerProfile: {
        create: {
          slug: 'marcus-vance-electrician',
          bio: 'Licensed master electrician with over 9 years of residential and commercial experience. Specializing in EV charger installs, smart home automation, panel upgrades, and certified emergency electrical repairs.',
          category: 'Home Services',
          skills: ['EV Charger Install', 'Circuit Breakers', 'Panel Upgrades', 'Smart Lighting', 'Wiring Inspections'],
          hourlyRate: 75,
          startingPrice: 85,
          experienceYears: 9,
          serviceArea: 'Seattle, Bellevue, Kirkland & Redmond',
          responseTime: 'Under 30 mins',
          isAvailable: true,
          isVerified: true,
          rating: 4.95,
          reviewCount: 38,
          portfolioImages: [
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=800&auto=format&fit=crop&q=80',
          ],
          services: {
            create: [
              {
                title: 'Electrical Diagnostic & Safety Inspection',
                description: 'Full inspection of panels, grounding, GFCI outlets, and diagnostics for intermittent outages.',
                category: 'Home Services',
                durationMinutes: 60,
                price: 85,
                serviceArea: 'Greater Seattle Area',
                isActive: true,
              },
              {
                title: 'Level 2 EV Charger Installation',
                description: 'Dedicated 240V 50A breaker line installation, conduit running, and mounting of your EV charging station.',
                category: 'Home Services',
                durationMinutes: 180,
                price: 320,
                serviceArea: 'Greater Seattle Area',
                isActive: true,
              },
              {
                title: 'Smart Switch & Fixture Installation',
                description: 'Replace traditional switches with Lutron Caseta or Philips Hue smart dimmer setups up to 4 fixtures.',
                category: 'Home Services',
                durationMinutes: 90,
                price: 130,
                serviceArea: 'Greater Seattle Area',
                isActive: true,
              },
            ],
          },
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isBlocked: false },
              { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isBlocked: false },
              { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isBlocked: false },
              { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isBlocked: false },
              { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isBlocked: false },
              { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isBlocked: false },
            ],
          },
        },
      },
    },
    include: {
      workerProfile: {
        include: {
          services: true,
        },
      },
    },
  });

  // 3. Worker 2: Elena Rostova (Cleaning Pro)
  const worker2 = await prisma.user.create({
    data: {
      email: 'elena@worklink.com',
      passwordHash,
      name: 'Elena Rostova',
      role: 'WORKER',
      phone: '+1 (555) 765-4321',
      location: 'Capitol Hill, Seattle',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      workerProfile: {
        create: {
          slug: 'elena-rostova-cleaning',
          bio: 'Eco-friendly deep cleaning expert. 6+ years keeping homes, apartments, and boutique offices spotless using non-toxic child and pet safe products.',
          category: 'Cleaning',
          skills: ['Deep Cleaning', 'Move-in/Move-out', 'Eco-friendly Supplies', 'Kitchen Sanitization', 'Post-renovation'],
          hourlyRate: 50,
          startingPrice: 95,
          experienceYears: 6,
          serviceArea: 'Seattle Central & Northside',
          responseTime: 'Under 1 hour',
          isAvailable: true,
          isVerified: true,
          rating: 4.98,
          reviewCount: 52,
          portfolioImages: [
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80',
          ],
          services: {
            create: [
              {
                title: 'Standard Home Refresh (2-3 Bed)',
                description: 'Dusting, vacuuming, mopping, bathroom sanitization, and kitchen counter degreasing.',
                category: 'Cleaning',
                durationMinutes: 150,
                price: 140,
                serviceArea: 'Seattle Central',
                isActive: true,
              },
              {
                title: 'Deep Clean & Disinfection',
                description: 'Intense scrub including baseboards, inside oven, inside microwave, tile grout, and window sills.',
                category: 'Cleaning',
                durationMinutes: 240,
                price: 260,
                serviceArea: 'Seattle Central',
                isActive: true,
              },
            ],
          },
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isBlocked: false },
              { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isBlocked: false },
              { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isBlocked: false },
              { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isBlocked: false },
              { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isBlocked: false },
            ],
          },
        },
      },
    },
    include: {
      workerProfile: {
        include: {
          services: true,
        },
      },
    },
  });

  // 4. Worker 3: David Chen (Plumber & HVAC)
  const worker3 = await prisma.user.create({
    data: {
      email: 'david@worklink.com',
      passwordHash,
      name: 'David Chen',
      role: 'WORKER',
      phone: '+1 (555) 456-7890',
      location: 'Bellevue, WA',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      workerProfile: {
        create: {
          slug: 'david-chen-plumbing',
          bio: '12 years certified plumbing & HVAC professional. Faucets, water heaters, toilet rebuilds, unclogging drains, and heat pump servicing.',
          category: 'Repairs',
          skills: ['Leak Detection', 'Pipe Repair', 'Water Heaters', 'Garbage Disposal', 'HVAC Filter Systems'],
          hourlyRate: 80,
          startingPrice: 90,
          experienceYears: 12,
          serviceArea: 'Bellevue, Redmond & Eastside',
          responseTime: 'Under 45 mins',
          isAvailable: true,
          isVerified: true,
          rating: 4.88,
          reviewCount: 44,
          portfolioImages: [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
          ],
          services: {
            create: [
              {
                title: 'Emergency Leak & Drain Snaking',
                description: 'Fast diagnosis and high-torque mechanical snaking for clogged kitchen or main waste lines.',
                category: 'Repairs',
                durationMinutes: 60,
                price: 110,
                serviceArea: 'Eastside',
                isActive: true,
              },
              {
                title: 'Tankless & Tank Water Heater Flush',
                description: 'Descale mineral build-up, check anode rod, test temperature pressure relief valve.',
                category: 'Repairs',
                durationMinutes: 90,
                price: 165,
                serviceArea: 'Eastside',
                isActive: true,
              },
            ],
          },
        },
      },
    },
  });

  // 5. Worker 4: Sarah Jenkins (Personal Wellness)
  const worker4 = await prisma.user.create({
    data: {
      email: 'sarah@worklink.com',
      passwordHash,
      name: 'Sarah Jenkins',
      role: 'WORKER',
      phone: '+1 (555) 321-6549',
      location: 'Ballard, Seattle',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      workerProfile: {
        create: {
          slug: 'sarah-jenkins-wellness',
          bio: 'NASM certified personal trainer and mobility coach. Specializing in functional fitness, injury recovery, and custom nutrition programs.',
          category: 'Beauty & Wellness',
          skills: ['Strength Conditioning', 'Posture Correction', 'Mobility Training', 'Nutrition Plans'],
          hourlyRate: 65,
          startingPrice: 60,
          experienceYears: 5,
          serviceArea: 'In-home Seattle & Online',
          responseTime: 'Under 1 hour',
          isAvailable: true,
          isVerified: true,
          rating: 4.97,
          reviewCount: 29,
          portfolioImages: [
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
          ],
          services: {
            create: [
              {
                title: '1-on-1 Personalized Fitness Assessment & Training',
                description: 'Full body movement screen followed by customized 60-minute strength and conditioning session.',
                category: 'Beauty & Wellness',
                durationMinutes: 60,
                price: 70,
                serviceArea: 'Seattle & Remote',
                isActive: true,
              },
            ],
          },
        },
      },
    },
  });

  // 6. Worker 5: Alex Rivera (Moving & Furniture Assembly)
  const worker5 = await prisma.user.create({
    data: {
      email: 'alex@worklink.com',
      passwordHash,
      name: 'Alex Rivera',
      role: 'WORKER',
      phone: '+1 (555) 654-9871',
      location: 'South Seattle, WA',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      workerProfile: {
        create: {
          slug: 'alex-rivera-moving',
          bio: 'Professional furniture assembler and local moving specialist. Expert with IKEA, Wayfair, heavy lifting, and careful packing.',
          category: 'Moving',
          skills: ['IKEA Assembly', 'Furniture Moving', 'Truck Loading', 'Wall Mounting'],
          hourlyRate: 48,
          startingPrice: 55,
          experienceYears: 4,
          serviceArea: 'Greater Seattle Area',
          responseTime: 'Under 15 mins',
          isAvailable: true,
          isVerified: true,
          rating: 4.91,
          reviewCount: 31,
          portfolioImages: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
          ],
          services: {
            create: [
              {
                title: 'Furniture Assembly (IKEA / Wayfair / West Elm)',
                description: 'Precision assembly of bedframes, desks, shelving units, wardrobes, and TV stands with professional tools.',
                category: 'Moving',
                durationMinutes: 120,
                price: 95,
                serviceArea: 'Greater Seattle Area',
                isActive: true,
              },
            ],
          },
        },
      },
    },
  });

  // Create Bookings for clientUser & worker1 (Marcus)
  const service1 = worker1.workerProfile.services[0]; // Diagnostic
  const service2 = worker1.workerProfile.services[1]; // EV charger

  // Completed Booking with Review & Payment
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);

  const completedBooking = await prisma.booking.create({
    data: {
      clientId: clientUser.id,
      workerId: worker1.id,
      serviceId: service1.id,
      bookingDate: pastDate,
      timeSlot: '10:00 AM - 11:00 AM',
      requestDetails: 'Kitchen GFCI outlets stopped responding after storm. Need inspection and replacement.',
      quotedPrice: service1.price,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      notes: 'Replaced faulty 20A GFCI receptacle and checked ground loop.',
      payment: {
        create: {
          clientId: clientUser.id,
          workerId: worker1.id,
          amount: service1.price,
          currency: 'USD',
          provider: 'stripe_test',
          providerPaymentId: 'ch_test_9923841029384',
          status: 'PAID',
        },
      },
      review: {
        create: {
          clientId: clientUser.id,
          workerId: worker1.id,
          rating: 5,
          comment: 'Marcus arrived right on time, had all parts in his van, diagnosed the faulty GFCI in 10 minutes and had everything working safely. Extremely professional and courteous!',
          workerResponse: 'Thank you Jessica! Glad we got your kitchen power back safely. Do not hesitate to call if you ever need any smart switches installed!',
          isVerified: true,
        },
      },
    },
  });

  // Active / Accepted Upcoming Booking
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);

  const upcomingBooking = await prisma.booking.create({
    data: {
      clientId: clientUser.id,
      workerId: worker1.id,
      serviceId: service2.id,
      bookingDate: futureDate,
      timeSlot: '02:00 PM - 05:00 PM',
      requestDetails: 'Installing Tesla Wall Connector in our 2-car garage. 200A panel is located nearby on garage wall.',
      quotedPrice: service2.price,
      status: 'ACCEPTED',
      paymentStatus: 'PENDING',
      notes: 'Customer confirmed panel clearance is ready.',
    },
  });

  // Pending Booking with worker2 (Elena)
  const pendingDate = new Date();
  pendingDate.setDate(pendingDate.getDate() + 6);
  const elenaService = worker2.workerProfile.services[0];

  const pendingBooking = await prisma.booking.create({
    data: {
      clientId: clientUser.id,
      workerId: worker2.id,
      serviceId: elenaService.id,
      bookingDate: pendingDate,
      timeSlot: '09:00 AM - 11:30 AM',
      requestDetails: 'Standard home clean before family visits for the weekend. 2 bedrooms, 2 bathrooms.',
      quotedPrice: elenaService.price,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
  });

  // Conversation between Jessica & Marcus
  const conversation = await prisma.conversation.create({
    data: {
      clientId: clientUser.id,
      workerId: worker1.id,
      bookingId: upcomingBooking.id,
      messages: {
        create: [
          {
            senderId: clientUser.id,
            content: 'Hi Marcus, looking forward to the EV charger installation this Thursday! Do I need to buy any specific breaker before you arrive?',
            isRead: true,
          },
          {
            senderId: worker1.id,
            content: 'Hi Jessica! No need to purchase anything. I carry standard Square D and Siemens 50A dual-pole breakers and heavy-gauge copper conduit in my service truck. I will see you at 2:00 PM!',
            isRead: true,
          },
          {
            senderId: clientUser.id,
            content: 'Perfect, thank you! Garage door code will be sent in the morning.',
            isRead: false,
          },
        ],
      },
    },
  });

  // Notifications for Jessica (Client)
  await prisma.notification.createMany({
    data: [
      {
        userId: clientUser.id,
        title: 'Booking Accepted',
        message: 'Marcus Vance accepted your EV Charger Installation request for ' + futureDate.toLocaleDateString(),
        type: 'BOOKING_ACCEPTED',
        link: '/client/bookings',
        isRead: false,
      },
      {
        userId: clientUser.id,
        title: 'New Message from Marcus',
        message: 'Marcus sent you a message regarding your upcoming appointment.',
        type: 'NEW_MESSAGE',
        link: '/client/messages',
        isRead: false,
      },
      {
        userId: clientUser.id,
        title: 'Work Completed & Receipt',
        message: 'Electrical Diagnostic & Safety Inspection completed. Thank you for your review!',
        type: 'BOOKING_COMPLETED',
        link: '/client/payments',
        isRead: true,
      },
    ],
  });

  // Notifications for Marcus (Worker)
  await prisma.notification.createMany({
    data: [
      {
        userId: worker1.id,
        title: 'New Booking Request',
        message: 'Jessica Reynolds booked Level 2 EV Charger Installation.',
        type: 'BOOKING_REQUEST',
        link: '/worker/bookings',
        isRead: true,
      },
      {
        userId: worker1.id,
        title: '5-Star Review Received!',
        message: 'Jessica Reynolds left a 5-star review: "Marcus arrived right on time..."',
        type: 'REVIEW_RECEIVED',
        link: '/worker/reviews',
        isRead: false,
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log('Demo Accounts:');
  console.log('Client: client@worklink.com / password123');
  console.log('Worker: marcus@worklink.com / password123');
  console.log('Worker 2: elena@worklink.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
