import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@martmony.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await hash(adminPassword, 12)
    await prisma.user.create({
      data: { email: adminEmail, name: 'Admin', passwordHash, role: 'ADMIN' },
    })
    console.log(`✅ Admin user created: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`)
  }

  const sampleProfiles = [
    {
      name: 'Priya Sharma',
      gender: 'FEMALE' as const,
      dateOfBirth: new Date('1995-03-15'),
      birthTime: '06:30',
      birthPlace: 'Bangalore, Karnataka',
      currentCity: 'Bangalore',
      currentState: 'Karnataka',
      caste: 'Brahmin',
      subCaste: 'Smartha',
      gotram: 'Bharadvaja',
      nakshatra: 'Rohini',
      rashi: 'Vrishabha (Taurus)',
      mangalDosha: false,
      education: 'B.Tech.',
      educationDetail: 'Computer Science, RVCE Bangalore',
      occupation: 'Software Engineer',
      annualIncomeLpa: 12.0,
      fatherName: 'Suresh Sharma',
      motherName: 'Lakshmi Sharma',
      familyType: 'NUCLEAR' as const,
      familyValues: 'Traditional',
      contactPhone: '9876543210',
      status: 'ACTIVE' as const,
      consentGiven: true,
    },
    {
      name: 'Arjun Reddy',
      gender: 'MALE' as const,
      dateOfBirth: new Date('1992-07-22'),
      birthTime: '14:15',
      birthPlace: 'Hyderabad, Telangana',
      currentCity: 'Hyderabad',
      currentState: 'Telangana',
      caste: 'Kshatriya',
      subCaste: 'Reddy',
      gotram: 'Kaashyapa',
      nakshatra: 'Punarvasu',
      rashi: 'Mithuna (Gemini)',
      mangalDosha: false,
      education: 'MBA',
      educationDetail: 'Finance, IIM Ahmedabad',
      occupation: 'Business Analyst',
      annualIncomeLpa: 18.0,
      fatherName: 'Venkat Reddy',
      motherName: 'Sarada Reddy',
      familyType: 'JOINT' as const,
      familyValues: 'Moderate',
      contactPhone: '9123456789',
      status: 'ACTIVE' as const,
      consentGiven: true,
    },
    {
      name: 'Kavitha Iyer',
      gender: 'FEMALE' as const,
      dateOfBirth: new Date('1997-11-03'),
      birthTime: '08:00',
      birthPlace: 'Chennai, Tamil Nadu',
      currentCity: 'Chennai',
      currentState: 'Tamil Nadu',
      caste: 'Brahmin',
      subCaste: 'Iyer',
      sakha: 'Rigveda Shakha',
      gotram: 'Vatsa',
      nakshatra: 'Ashwini',
      rashi: 'Mesha (Aries)',
      mangalDosha: false,
      education: 'MBBS',
      occupation: 'Doctor',
      annualIncomeLpa: 8.0,
      fatherName: 'Krishnaswamy Iyer',
      motherName: 'Meenakshi Iyer',
      familyType: 'NUCLEAR' as const,
      familyValues: 'Traditional',
      contactPhone: '9988776655',
      status: 'ACTIVE' as const,
      consentGiven: true,
    },
    {
      name: 'Rahul Verma',
      gender: 'MALE' as const,
      dateOfBirth: new Date('1993-05-18'),
      birthTime: '11:45',
      birthPlace: 'Lucknow, Uttar Pradesh',
      currentCity: 'Noida',
      currentState: 'Uttar Pradesh',
      caste: 'Brahmin',
      subCaste: 'Kanyakubja',
      gotram: 'Gautama',
      nakshatra: 'Hasta',
      rashi: 'Kanya (Virgo)',
      mangalDosha: true,
      education: 'B.Tech.',
      occupation: 'Software Developer',
      annualIncomeLpa: 15.0,
      familyType: 'JOINT' as const,
      familyValues: 'Moderate',
      status: 'ACTIVE' as const,
      consentGiven: true,
    },
  ]

  for (const profile of sampleProfiles) {
    const exists = await prisma.profile.findFirst({ where: { name: profile.name } })
    if (!exists) {
      await prisma.profile.create({ data: profile })
      console.log(`✅ Sample profile created: ${profile.name}`)
    }
  }

  console.log('\n🎉 Database seeded successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
