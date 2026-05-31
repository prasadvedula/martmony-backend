import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
const BATCH = 'KNBS-2026'
const COMMON_PASSWORD = 'Baru@1009'

// Height: feet.inches → cm (e.g. 5.7 → 170, 5.10 → 178)
function ht(val: string): number | undefined {
  const m = val.match(/^(\d+)\.(\d+)$/)
  if (m) return Math.round(parseInt(m[1]) * 30.48 + parseInt(m[2]) * 2.54)
  if (val === '172cm') return 172
  return undefined
}

interface ProfileInput {
  loginId: string
  name: string
  gender: 'MALE' | 'FEMALE'
  dob: string
  birthTime?: string
  birthPlace: string
  currentCity?: string
  currentState?: string
  gotram?: string
  subCaste?: string
  nakshatra: string
  heightCm?: number
  education?: string
  occupation?: string
  annualIncomeLpa?: number
  fatherName?: string
  contactPhone?: string
}

const BOYS: ProfileInput[] = [
  { loginId: '100001', name: 'Ramaraju Chandra Sekhar', gender: 'MALE', dob: '1973-12-05', birthTime: '17:23', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Lohithasa', subCaste: '6000 Niyogi', nakshatra: 'Revathi', heightCm: ht('5.7'), education: 'B.Sc Maths', occupation: 'Associate Secretary (Govt)', annualIncomeLpa: 18, fatherName: 'R.V.S. Rama Rao', contactPhone: '8099098989' },
  { loginId: '100002', name: 'Jampani Sreenivas', gender: 'MALE', dob: '1974-08-12', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Sandilyasa', subCaste: 'Vaidiki Velnadu', nakshatra: 'Kruthika', heightCm: ht('5.6'), education: 'M.Sc/MBA', occupation: 'Business', fatherName: 'Dakshinamurthy', contactPhone: '9581971572' },
  { loginId: '100003', name: 'Rampally Venkata Surya Rama Krishna', gender: 'MALE', dob: '1975-09-30', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Srivatsasa', subCaste: '6000 Niyogi', nakshatra: 'Pushyami', heightCm: ht('5.3'), education: 'M.Sc', occupation: 'Dy. Manager, MSN Laboratories', annualIncomeLpa: 10.8, fatherName: 'R. Suryanarayana Murthy', contactPhone: '9949212885' },
  { loginId: '100004', name: 'Chaturvedula Sriram', gender: 'MALE', dob: '1976-07-28', birthPlace: 'Hyderabad', currentCity: 'Austin, Texas', currentState: 'USA', gotram: 'Kasyapasa', subCaste: 'Vaidiki Telaganula', nakshatra: 'Ashlesha', education: 'B.Tech (MS USA)', occupation: 'Software Engineer, USA', fatherName: 'Seetharama Murthy', contactPhone: '9849569479' },
  { loginId: '100005', name: 'Ogirala Venkata Subramayam', gender: 'MALE', dob: '1979-11-20', birthTime: '13:34', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velnadu', nakshatra: 'Anuradha', heightCm: ht('5.5'), education: 'M.Sc (Maths/IT)', occupation: 'Endowment Dept, Hyderabad', annualIncomeLpa: 12, fatherName: 'Venkata Subbaiah', contactPhone: '9885454536' },
  { loginId: '100006', name: 'Penumarthi Eswara Dattu', gender: 'MALE', dob: '1978-12-03', birthPlace: 'Visakhapatnam', currentCity: 'Visakhapatnam', currentState: 'Andhra Pradesh', gotram: 'Koundinyasa', subCaste: 'Vaidiki Vegiadu', nakshatra: 'Uttarashada', heightCm: ht('5.11'), education: 'M.Sc', occupation: 'College Owner', annualIncomeLpa: 20, fatherName: 'Ranga Sai', contactPhone: '9158987667' },
  { loginId: '100007', name: 'Chillar Sai Kiran', gender: 'MALE', dob: '1982-11-22', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Dhanista', heightCm: ht('5.11'), education: 'B.Com (Comp)', occupation: 'Business (Laven Agency)', annualIncomeLpa: 8, fatherName: 'Krishna Sai Kumar', contactPhone: '9705717187' },
  { loginId: '100008', name: 'Vajjhula Siva Subrahmanyam', gender: 'MALE', dob: '1981-03-21', birthTime: '14:07', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Kousikasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Hasta', heightCm: ht('6.0'), education: 'B.Sc/MBA', occupation: 'Software Engineer', annualIncomeLpa: 35, fatherName: 'V.L. Narasimha Murthy', contactPhone: '9618808001' },
  { loginId: '100009', name: 'Anantharaju Venu Gopal Rao', gender: 'MALE', dob: '1981-05-28', birthPlace: 'Nellore', currentCity: 'Nellore', currentState: 'Andhra Pradesh', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Purvabhadra', heightCm: ht('5.7'), education: 'B.Sc', occupation: 'Jr. Asst, Narayana Engineering College', annualIncomeLpa: 3, fatherName: 'A.L. Narasimham', contactPhone: '9490125456' },
  { loginId: '100010', name: 'Karempudi Raghavacharyulu', gender: 'MALE', dob: '1982-07-23', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Srivaishnavas Thenkalai', nakshatra: 'Makha', heightCm: ht('5.8'), education: 'B.Com/MA Telugu', occupation: 'Purohit/Teacher/Archaka', annualIncomeLpa: 6, fatherName: 'Srinivasacharyulu', contactPhone: '7708458431' },
  { loginId: '100011', name: 'Sompalli Sampath', gender: 'MALE', dob: '1983-10-07', birthTime: '10:15', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Rathirasa', subCaste: '6000 Niyogi', nakshatra: 'Chitta', heightCm: ht('5.6'), education: 'MBA/DOT NET', occupation: 'Software Engineer (Digital Marketing)', annualIncomeLpa: 2.4, fatherName: 'Rajesh Kumar', contactPhone: '9908356905' },
  { loginId: '100012', name: 'Anantharaju Rama Krishna', gender: 'MALE', dob: '1984-12-13', birthTime: '07:58', birthPlace: 'Nellore', currentCity: 'Nellore', currentState: 'Andhra Pradesh', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Ashlesha', heightCm: ht('5.10'), education: 'B.Tech', occupation: 'Software Engineer', annualIncomeLpa: 45, fatherName: 'A.L. Narasimham', contactPhone: '9490125456' },
  { loginId: '100013', name: 'Koppolu Santosh Kumar', gender: 'MALE', dob: '1985-06-14', birthTime: '03:00', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Kousikasa', subCaste: '6000 Niyogi', nakshatra: 'Ashwini', heightCm: ht('5.8'), education: 'B.Tech (Comp)', occupation: 'Software Engineer, Wipro', annualIncomeLpa: 28.8, fatherName: 'K. Rajendra Prasad', contactPhone: '9642111144' },
  { loginId: '100014', name: 'Sistla Sakshi Sai Ram', gender: 'MALE', dob: '1985-10-16', birthTime: '04:10', birthPlace: 'Guntur', currentCity: 'Chennai', currentState: 'Tamil Nadu', gotram: 'Koundinyasa', subCaste: 'Vaidiki Murikinadu', nakshatra: 'Visakha', heightCm: ht('5.6'), education: 'B.Com', occupation: 'Team Leader, American Company', annualIncomeLpa: 3.6, fatherName: 'S. Chandra Sekhar', contactPhone: '9866085741' },
  { loginId: '100015', name: 'Cheruvu Bharath Kumar', gender: 'MALE', dob: '1985-10-08', birthTime: '22:50', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Pushyami', heightCm: ht('5.9'), education: 'B.Sc (Comp)/MBA', occupation: 'Asst. Manager', annualIncomeLpa: 16, fatherName: 'C.B. Ramakrishna Rao', contactPhone: '9493404729' },
  { loginId: '100016', name: 'B. Venkata Surya Nacharaiah', gender: 'MALE', dob: '1984-08-17', birthTime: '21:35', birthPlace: 'Vijayawada', currentCity: 'Vijayawada', currentState: 'Andhra Pradesh', gotram: 'Lohithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Ashwini', heightCm: ht('5.5'), education: 'Intermediate', occupation: 'Purohit', annualIncomeLpa: 6, fatherName: 'Durga Narayana Sastry', contactPhone: '9490425043' },
  { loginId: '100017', name: 'Sista Bhaskara Srikanth', gender: 'MALE', dob: '1985-06-06', birthTime: '07:05', birthPlace: 'Visakhapatnam', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Vaidiki Kasalanadu', nakshatra: 'Uttarashada', heightCm: ht('5.10'), education: 'B.Tech (ECE)', occupation: 'Software Engineer, CAPCO Technologies', annualIncomeLpa: 15, fatherName: 'Satyanarayana Murthy', contactPhone: '8639968300' },
  { loginId: '100018', name: 'Ayyalasomayajula Santhosh Ram', gender: 'MALE', dob: '1985-02-15', birthTime: '13:30', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Konaseema Dravida', nakshatra: 'Moola', heightCm: ht('5.8'), education: 'M.Tech (Mfg. Engg)', occupation: 'Principal SW Consultant', annualIncomeLpa: 30, fatherName: 'AVS Subrahmanyam', contactPhone: '9989466438' },
  { loginId: '100019', name: 'Peethapa Madhava Kamalakara Sarma', gender: 'MALE', dob: '1985-07-03', birthTime: '03:48', birthPlace: 'Vijayawada', currentCity: 'Vijayawada', currentState: 'Andhra Pradesh', gotram: 'Gowthamasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Purvaashada', heightCm: ht('5.7'), education: '10th Class', occupation: 'Purohit', annualIncomeLpa: 6, fatherName: 'Nagaraju', contactPhone: '9032966478' },
  { loginId: '100020', name: 'Katuru Venkata Srikanth Kumar', gender: 'MALE', dob: '1985-11-26', birthTime: '14:40', birthPlace: 'Khammam', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: '6000 Niyogi', nakshatra: 'Krithika', heightCm: ht('5.9'), education: 'M.Com/CA Inter', occupation: 'Nspira Management Services', annualIncomeLpa: 9, fatherName: 'K.V.R.Ch. Kishore', contactPhone: '7730852952' },
  { loginId: '100021', name: 'Vemavarapu Diwakar', gender: 'MALE', dob: '1986-03-10', birthTime: '19:10', birthPlace: 'Nuziveedu', currentCity: 'Nuziveedu', currentState: 'Andhra Pradesh', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Purvabhadra', heightCm: ht('5.6'), education: 'B.Tech/M.Tech/PhD', occupation: 'AE Panchayat Raj Dept.', annualIncomeLpa: 5, fatherName: 'Sai Gopala Krishna', contactPhone: '8885431335' },
  { loginId: '100022', name: 'Gide Siva Ram', gender: 'MALE', dob: '1986-05-23', birthTime: '03:00', birthPlace: 'Hyderabad', currentCity: 'USA', currentState: 'USA', gotram: 'Vardhulasa', subCaste: 'Vaidiki Telaganya', nakshatra: 'Visakha', heightCm: ht('5.6'), education: 'M.Tech', occupation: 'Software Engineer, DTE Energy (USA)', fatherName: 'Srinivasa Sastry', contactPhone: '9908672707' },
  { loginId: '100023', name: 'Varanasi Ravi Kumar', gender: 'MALE', dob: '1986-04-23', birthTime: '04:40', birthPlace: 'Guntur', currentCity: 'Guntur', currentState: 'Andhra Pradesh', gotram: 'Srivastasa', subCaste: 'Vaidiki Karana Kamma', nakshatra: 'Ashlesha', heightCm: ht('5.9'), education: 'B.Tech', occupation: 'Sector Expert/Engineer', annualIncomeLpa: 6.6, fatherName: 'V.T. Sekhar', contactPhone: '8886053880' },
  { loginId: '100024', name: 'Pothukuchi Murtyunjaya Sagar', gender: 'MALE', dob: '1986-07-11', birthTime: '11:35', birthPlace: 'Chennai', currentCity: 'Chennai', currentState: 'Tamil Nadu', nakshatra: 'Makha', heightCm: ht('5.7'), education: 'B.Sc/MBA', occupation: 'Software Engineer, CTS', annualIncomeLpa: 7, fatherName: 'P. Srinivasa Prasad', contactPhone: '8500222183' },
  { loginId: '100025', name: 'Somaraju Jaikanth', gender: 'MALE', dob: '1986-11-08', birthTime: '13:35', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Sravanam', heightCm: ht('5.6'), education: 'B.Com/LLB', occupation: 'Advocate', annualIncomeLpa: 6, fatherName: 'Kamalakar Rao', contactPhone: '9533783456' },
  { loginId: '100026', name: 'Kavuluru Vamshi Krishna Sujith', gender: 'MALE', dob: '1987-08-11', birthTime: '14:10', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Purvabhadra', heightCm: ht('5.7'), education: 'M.Com/ICWA', occupation: 'Financial Director', annualIncomeLpa: 18, fatherName: 'KBP Rao', contactPhone: '9502668068' },
  { loginId: '100027', name: 'Salaka Damodhar Sastry', gender: 'MALE', dob: '1988-09-15', birthPlace: 'Vijayawada', currentCity: 'Vijayawada', currentState: 'Andhra Pradesh', gotram: 'Atreyasa', subCaste: 'Vaidiki Telaganulu', nakshatra: 'Swathi', education: '10th Class', occupation: 'Purohit', annualIncomeLpa: 9.6, contactPhone: '9030534555' },
  { loginId: '100028', name: 'Penumaka Kali Chandra Charan', gender: 'MALE', dob: '1988-12-04', birthTime: '12:05', birthPlace: 'Guntur', currentCity: 'Guntur', currentState: 'Andhra Pradesh', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Hasta', heightCm: ht('5.7'), education: 'M.Com/MBA', occupation: 'Manager', annualIncomeLpa: 5, fatherName: 'Nageswara Rao', contactPhone: '9441254044' },
  { loginId: '100029', name: 'Madiraju Pavan Kumar', gender: 'MALE', dob: '1989-01-28', birthTime: '00:05', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Parasara', subCaste: '6000 Niyogi', nakshatra: 'Chitta', heightCm: ht('5.5'), education: 'CA', occupation: 'Account Manager', annualIncomeLpa: 10, fatherName: 'Raghava Rao', contactPhone: '8074275956' },
  { loginId: '100030', name: 'Turumella Prasantha Seshasai Sasidhar', gender: 'MALE', dob: '1989-09-01', birthTime: '21:20', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Uttaraphalguni', heightCm: ht('6.0'), education: 'B.Com/MBA', occupation: 'Food Business', annualIncomeLpa: 8.4, fatherName: 'Venkata Subba Rao', contactPhone: '7799162482' },
  { loginId: '100031', name: 'Nookala Vivek', gender: 'MALE', dob: '1989-04-14', birthTime: '16:25', birthPlace: 'Hyderabad', currentCity: 'Pune', currentState: 'Maharashtra', gotram: 'Bharadwajasa', subCaste: 'Vaidiki Kasalanadu', nakshatra: 'Ashlesha', education: 'B.Tech', occupation: 'Software Engineer', annualIncomeLpa: 12, fatherName: 'Prasad', contactPhone: '7382587145' },
  { loginId: '100032', name: 'Divakaruni Subrahmanya Sarma', gender: 'MALE', dob: '1989-05-04', birthTime: '01:20', birthPlace: 'Karimnagar', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Revathi', heightCm: ht('5.8'), education: 'B.Com/M.Com/MBA', occupation: 'Construction Services', annualIncomeLpa: 12, fatherName: 'Venkateswara Sarma', contactPhone: '9866022246' },
  { loginId: '100033', name: 'Chavali Aditya', gender: 'MALE', dob: '1989-07-11', birthTime: '17:20', birthPlace: 'Chennai', currentCity: 'Chennai', currentState: 'Tamil Nadu', gotram: 'Kousikasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Chitta', heightCm: 172, education: 'Masters', occupation: 'Non-IT Professional', annualIncomeLpa: 23, fatherName: 'Gopal', contactPhone: '9003080057' },
  { loginId: '100034', name: 'Tumuluri Gopi Krishna', gender: 'MALE', dob: '1989-12-05', birthTime: '08:02', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Sathabhisham', heightCm: ht('5.7'), education: 'MCA', occupation: 'Jr. Asst, Judicial Magistrate Court', annualIncomeLpa: 6.5, fatherName: 'T.V.N. Vara Prasad', contactPhone: '9490673146' },
  { loginId: '100035', name: 'Manju Pavan Kumar', gender: 'MALE', dob: '1990-02-15', birthTime: '18:42', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Golconda Vyaparlu', nakshatra: 'Swathi', heightCm: ht('5.10'), education: 'B.Tech', occupation: 'Asst. Manager, Genpack', annualIncomeLpa: 10.5, fatherName: 'M. Srinivasa Rao', contactPhone: '9704137239' },
  { loginId: '100036', name: 'Mushunuri Manohar Venkat', gender: 'MALE', dob: '1990-07-24', birthTime: '05:45', birthPlace: 'Raipur', currentCity: 'Mumbai', currentState: 'Maharashtra', gotram: 'Koundinyasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Makha', heightCm: ht('6.1'), education: 'B.Sc', occupation: 'Line Producer', annualIncomeLpa: 14, fatherName: 'Ravi Shankar', contactPhone: '9926127005' },
  { loginId: '100037', name: 'Renduchintala Sai Siva Teja', gender: 'MALE', dob: '1990-08-02', birthTime: '04:45', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Jyesta', heightCm: ht('5.10'), education: 'M.Tech', occupation: 'Operations Manager (Digital Marketing)', annualIncomeLpa: 12, fatherName: 'Mallikarjuna Prasad', contactPhone: '9441550477' },
  { loginId: '100038', name: 'C. Simha Krishna Datta', gender: 'MALE', dob: '1991-01-22', birthTime: '02:20', birthPlace: 'Khammam', currentCity: 'Khammam', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Sathabhisham', heightCm: ht('5.5'), education: 'Diploma (CME)', occupation: 'Purohit / Hardware Software Sales', annualIncomeLpa: 5.4, fatherName: 'Rajeswara Sarma', contactPhone: '9490425043' },
  { loginId: '100039', name: 'Jalasutra Venkata Sudheer Kumar', gender: 'MALE', dob: '1991-05-28', birthTime: '06:48', birthPlace: 'Warangal', currentCity: 'Warangal', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Anuradha', heightCm: ht('5.10'), annualIncomeLpa: 5.4, fatherName: 'Satya Anjaya Sarma', contactPhone: '6302266023' },
  { loginId: '100040', name: 'Tankasali Sripada', gender: 'MALE', dob: '1991-12-01', birthTime: '20:20', birthPlace: 'Mahabubnagar', currentCity: 'Mahabubnagar', currentState: 'Telangana', gotram: 'Kashyapasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Hasta', heightCm: ht('5.5'), education: '10th Class', occupation: 'Purohit', annualIncomeLpa: 3.6, fatherName: 'Krishna Chary', contactPhone: '9985529519' },
  { loginId: '100041', name: 'Kandala NVS Ravi Shankar', gender: 'MALE', dob: '1993-07-30', birthTime: '12:06', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Vadhulasa', subCaste: 'Dravida', nakshatra: 'Moola', heightCm: ht('5.11'), education: 'B.Com', occupation: 'DPS, Admin Dept.', annualIncomeLpa: 5, fatherName: 'K.N. Rao', contactPhone: '8500575489' },
  { loginId: '100042', name: 'Mahankali Santhosh Goutham', gender: 'MALE', dob: '1993-11-22', birthTime: '08:30', birthPlace: 'Hyderabad', currentCity: 'Hanumakonda', currentState: 'Telangana', gotram: 'Kuthsasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Sathabhisham', education: 'Integrated M.Sc (Applied Geology)', occupation: 'Scientist-C, Central Govt (Hydrogeologist)', annualIncomeLpa: 16, fatherName: 'Gopal', contactPhone: '9440170667' },
  { loginId: '100043', name: 'Kurumeti Sai Ram', gender: 'MALE', dob: '1995-03-05', birthTime: '08:30', birthPlace: 'Badvel', currentCity: 'Badvel', currentState: 'Andhra Pradesh', gotram: 'Srivatsasa', subCaste: 'Niyogi PS', nakshatra: 'Ashwini', heightCm: ht('5.5'), education: 'B.Sc (Comp)/TTC', occupation: 'Lecturer / Purohit', annualIncomeLpa: 9.6, fatherName: 'K. Suryanarayana Rao', contactPhone: '6301152358' },
  { loginId: '100044', name: 'Mylavarapu Srinivasa Kalyan', gender: 'MALE', dob: '1998-10-03', birthTime: '18:12', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Sathabhisham', heightCm: ht('5.4'), education: 'BBA/MBA', occupation: 'Branch Manager, Sany India Pvt Ltd', annualIncomeLpa: 8, fatherName: 'M. Subba Rao', contactPhone: '9848244767' },
  { loginId: '100045', name: 'Taduri GRVVS Sanjeev', gender: 'MALE', dob: '1999-04-11', birthTime: '11:25', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Vadhulasa', subCaste: 'Madwas', nakshatra: 'Dhanista', heightCm: ht('5.10'), education: 'Mechanical Engg/MA Astrology', occupation: 'Purohit / Astrologer', annualIncomeLpa: 9.5, fatherName: 'Balaji Rama Rao', contactPhone: '9963580778' },
  { loginId: '100046', name: 'Nori Raghava Narayana Sarma', gender: 'MALE', dob: '2003-01-25', birthTime: '00:40', birthPlace: 'Tenali', currentCity: 'Tenali', currentState: 'Andhra Pradesh', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Chitta', heightCm: ht('5.11'), education: 'Krishna Yajurvedam Ghanapati', occupation: 'Vaidikam (Vedic Scholar)', fatherName: 'Malleswara Rao', contactPhone: '6302601581' },
  { loginId: '100047', name: 'Lakkaraju Venkata Goutham Kumar', gender: 'MALE', dob: '1987-12-25', birthTime: '06:36', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Gouthamasa', subCaste: '6000 Niyogi', nakshatra: 'Sathabhisham', heightCm: ht('5.6'), education: 'B.Com/CA Final', occupation: 'Electronics Equipment Company', annualIncomeLpa: 12.14, fatherName: 'Chandra Sekhara Rao', contactPhone: '9849562611' },
  { loginId: '100048', name: 'Devulapalli Suryanarayana Datta Kumar', gender: 'MALE', dob: '1989-10-24', birthTime: '11:50', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Vaidiki Telaganyula', nakshatra: 'Makha', heightCm: ht('5.10'), education: 'B.Tech/MBA (HR)', occupation: 'HR Executive, Srikar Bio tech', annualIncomeLpa: 8.5, fatherName: 'DAP Sastry', contactPhone: '9949471487' },
  { loginId: '100049', name: 'Eswara Marthanda Raghuram', gender: 'MALE', dob: '1987-04-07', birthTime: '09:45', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Pushyami', heightCm: ht('5.9'), education: 'MBA/B.Tech', occupation: 'Software Engineer, Medtronic', annualIncomeLpa: 30, fatherName: 'Jagadeesh', contactPhone: '9490316787' },
  { loginId: '100050', name: 'Annamraju V.S.M. Krishna Santhosh Kumar', gender: 'MALE', dob: '1987-05-10', birthTime: '10:05', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Hasta', heightCm: ht('5.4'), education: 'M.Com/Finance', occupation: 'Audit Asst., Ramann & Co.', annualIncomeLpa: 6, fatherName: 'ALN Murthy', contactPhone: '9989143845' },
  { loginId: '100051', name: 'Karanam Hari Hara Kumar', gender: 'MALE', dob: '1988-12-03', birthTime: '01:20', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: '6000 Niyogi', nakshatra: 'Uttaraphalguni', education: 'B.Com/ITI', occupation: 'Professional', annualIncomeLpa: 8, fatherName: 'K. Prabhakara Rao', contactPhone: '9676381811' },
]

const GIRLS: ProfileInput[] = [
  { loginId: '200001', name: 'Kottapalli Rajasri', gender: 'FEMALE', dob: '1963-11-26', birthPlace: 'Vijayawada', currentCity: 'Vijayawada', currentState: 'Andhra Pradesh', gotram: 'Srivatsasa', nakshatra: 'Purvabhadra', education: 'Graduate', occupation: 'Central Govt Employee', fatherName: 'Krishna Murthy', contactPhone: '8341385309' },
  { loginId: '200002', name: 'Sripathi Lakshmi Katyayani', gender: 'FEMALE', dob: '1977-06-10', birthTime: '09:15', birthPlace: 'Secunderabad', currentCity: 'Secunderabad', currentState: 'Telangana', gotram: 'Kasyapasa', subCaste: '6000 Niyogi', nakshatra: 'Uttarabhadra', heightCm: ht('5.5'), education: 'MCA', fatherName: 'Sitapathi Rao', contactPhone: '9494064382' },
  { loginId: '200003', name: 'Akella Lakshmi', gender: 'FEMALE', dob: '1979-12-21', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Uttarashada', heightCm: ht('5.3'), education: 'B.Tech', fatherName: 'Jagannadam', contactPhone: '9441051126' },
  { loginId: '200004', name: 'Akella V.N.U. Rajya Lakshmi', gender: 'FEMALE', dob: '1982-12-21', birthTime: '06:27', birthPlace: 'Eluru', currentCity: 'Eluru', currentState: 'Andhra Pradesh', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Sathabhisham', heightCm: ht('5.2'), education: 'B.A./B.Ed', fatherName: 'V. Narasaiah', contactPhone: '9642028980' },
  { loginId: '200005', name: 'Akella Bhavani Sailaja', gender: 'FEMALE', dob: '1983-06-24', birthTime: '01:20', birthPlace: 'Visakhapatnam', currentCity: 'Visakhapatnam', currentState: 'Andhra Pradesh', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Jyesta', heightCm: ht('5.3'), education: 'B.Tech', fatherName: 'Sarma', contactPhone: '9902530101' },
  { loginId: '200006', name: 'Karanam Sudha Parimala', gender: 'FEMALE', dob: '1983-10-11', birthTime: '06:15', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Madwas', nakshatra: 'Ashwini', heightCm: ht('5.4'), education: 'Intermediate', contactPhone: '8019340798' },
  { loginId: '200007', name: 'Chodavarpu Soumya', gender: 'FEMALE', dob: '1984-06-20', birthTime: '07:50', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Purvabhadra', heightCm: ht('5.3'), education: 'M.Tech/MBA', occupation: 'Asst. Manager', annualIncomeLpa: 10, fatherName: 'Satyanarayana', contactPhone: '9948553574' },
  { loginId: '200008', name: 'Sambaraju Sai Santhoshi', gender: 'FEMALE', dob: '1984-07-21', birthTime: '11:30', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: '6000 Niyogi', nakshatra: 'Ashwini', heightCm: ht('5.2'), education: 'Master of Physiotherapy', occupation: 'Physiotherapy Clinic', annualIncomeLpa: 3.6, fatherName: 'Ravinder Rao', contactPhone: '9989441324' },
  { loginId: '200009', name: 'Ayyalasomayajula Aruna', gender: 'FEMALE', dob: '1984-09-14', birthTime: '07:45', birthPlace: 'Roorkela', currentCity: 'Visakhapatnam', currentState: 'Andhra Pradesh', gotram: 'Koundinyasa', subCaste: 'Dravida', nakshatra: 'Ashwini', heightCm: ht('5.3'), education: 'MBA', occupation: 'Bank Employee', annualIncomeLpa: 48, fatherName: 'Satyanarayana', contactPhone: '9618036567' },
  { loginId: '200010', name: 'Guntur Manjusha', gender: 'FEMALE', dob: '1984-10-09', birthPlace: 'Hyderabad', currentCity: 'USA', currentState: 'USA', gotram: 'Srivatsasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Uttarabhadra', heightCm: ht('5.5'), education: 'B.Tech/MS USA', occupation: 'Software Engineer, USA', annualIncomeLpa: 240, fatherName: 'Bhaskara Sarma', contactPhone: '9985220858' },
  { loginId: '200011', name: 'Mokkapati Archana', gender: 'FEMALE', dob: '1985-03-27', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Harithasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Rohini', heightCm: ht('5.3'), education: 'B.Tech/MBA', fatherName: 'Sreelakshmi', contactPhone: '8790234060' },
  { loginId: '200012', name: 'Durgaarapu Naga Durga Hemalatha', gender: 'FEMALE', dob: '1985-06-27', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Niyogi PSN', nakshatra: 'Swathi', heightCm: ht('5.3'), education: 'MCA', occupation: 'Software Engineer, Virtusa', annualIncomeLpa: 12, fatherName: 'Narayana Murthy', contactPhone: '9347369766' },
  { loginId: '200013', name: 'Addepalli Lavanya', gender: 'FEMALE', dob: '1985-07-21', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Kasyapasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Pubba', heightCm: ht('5.5'), education: 'M.Tech/PhD', contactPhone: '9959992930' },
  { loginId: '200014', name: 'Punnamraju Srujana', gender: 'FEMALE', dob: '1985-11-16', birthTime: '20:15', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'GVP', nakshatra: 'Purvaashada', education: 'B.Tech/MBA', occupation: 'Private Sector', annualIncomeLpa: 10, fatherName: 'P.R. Rao', contactPhone: '8790370885' },
  { loginId: '200015', name: 'K. Dravida Adiraju Sai Sudha', gender: 'FEMALE', dob: '1986-03-29', birthTime: '06:30', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', nakshatra: 'Visakha', heightCm: ht('5.6'), education: 'M.Com', occupation: 'Private Job', annualIncomeLpa: 1.5, fatherName: 'Vijaya Kumar', contactPhone: '7794925811' },
  { loginId: '200016', name: 'Putcha Satyakrishna', gender: 'FEMALE', dob: '1986-06-02', birthTime: '09:10', birthPlace: 'Hyderabad', currentCity: 'New York', currentState: 'USA', gotram: 'Gowthamasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Revathi', heightCm: ht('5.4'), education: 'MS', occupation: 'Team Leader (IT)', fatherName: 'Rama Sastry', contactPhone: '9704089039' },
  { loginId: '200017', name: 'Marella Bhargavi', gender: 'FEMALE', dob: '1987-10-28', birthPlace: 'Nellore', currentCity: 'Bangalore', currentState: 'Karnataka', gotram: 'Bharadwajasa', subCaste: 'Pradamasakha Niyogi', nakshatra: 'Purvaashada', heightCm: ht('5.2'), education: 'MCA', occupation: 'Software Engineer', annualIncomeLpa: 7, fatherName: 'Sri Satya Sai Lakshmi Narasimha Rao', contactPhone: '9848221150' },
  { loginId: '200018', name: 'Vutukuru Naga Santhosh Rukmini Keerthi', gender: 'FEMALE', dob: '1989-12-02', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Uttarashada', heightCm: ht('5.2'), education: 'B.Tech', occupation: 'QA Analyst', annualIncomeLpa: 12, fatherName: 'V. Prabhakar Rao', contactPhone: '9985018050' },
  { loginId: '200019', name: 'Tadikonda L. Siva Priya', gender: 'FEMALE', dob: '1990-06-01', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: '6000 Niyogi', nakshatra: 'Pubba', heightCm: 157, education: 'B.Tech', fatherName: 'Uma Shanker', contactPhone: '8985903565' },
  { loginId: '200020', name: 'Lanka Aparna', gender: 'FEMALE', dob: '1996-04-13', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Dhanista', education: 'B.Tech', occupation: 'Software Engineer', fatherName: 'L.V.V. Subba Rao', contactPhone: '9440263036' },
  { loginId: '200021', name: 'Poluru Jayasree', gender: 'FEMALE', dob: '1996-05-01', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Chitta', heightCm: ht('5.5'), education: 'BBA', occupation: 'Clarivate (Private)', annualIncomeLpa: 7.5, fatherName: 'Venkata Balaji', contactPhone: '9866385964' },
  { loginId: '200022', name: 'Akkni Srivalli', gender: 'FEMALE', dob: '2003-01-20', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Vaidiki', nakshatra: 'Makha', education: 'BA Sanskrit', fatherName: 'Gangadhar', contactPhone: '8688964500' },
  { loginId: '200023', name: 'Kaithepalli Sai Darshini', gender: 'FEMALE', dob: '2005-02-16', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Kousikasa', subCaste: 'Vaidiki Velanadu', nakshatra: 'Uttara', education: 'B.Com (pursuing)', fatherName: 'KVS Bhaskar', contactPhone: '9492741295' },
  { loginId: '200024', name: 'Soumya Madabushi', gender: 'FEMALE', dob: '1981-02-13', birthPlace: 'Hyderabad', currentCity: 'Hyderabad', currentState: 'Telangana', gotram: 'Bharadwajasa', subCaste: 'Madwas', nakshatra: 'Rohini', heightCm: ht('5.5'), education: 'MS/PhD', fatherName: 'Narasimha Chary', contactPhone: '9550574141' },
  { loginId: '200025', name: 'Atkuri Sravani', gender: 'FEMALE', dob: '1990-08-09', birthTime: '18:54', birthPlace: 'Tirupati', currentCity: 'Tirupati', currentState: 'Andhra Pradesh', gotram: 'Koundinyasa', subCaste: '6000 Niyogi', nakshatra: 'Punarvasu', education: 'M.Com', occupation: 'Jr. Assistant, TTD', annualIncomeLpa: 8.4, fatherName: 'Brahmananda Rao', contactPhone: '9550613050' },
]

async function main() {
  const passwordHash = await hash(COMMON_PASSWORD, 12)
  let created = 0
  let skipped = 0

  const allProfiles = [...BOYS, ...GIRLS]

  for (const p of allProfiles) {
    const exists = await prisma.user.findUnique({ where: { phone: p.loginId } })
    if (exists) { skipped++; continue }

    await prisma.user.create({
      data: {
        phone: p.loginId,
        name: p.name,
        passwordHash,
        role: 'USER',
        profile: {
          create: {
            name: p.name,
            gender: p.gender,
            dateOfBirth: new Date(p.dob),
            birthTime: p.birthTime,
            birthPlace: p.birthPlace,
            currentCity: p.currentCity,
            currentState: p.currentState,
            caste: 'Brahmin',
            subCaste: p.subCaste,
            gotram: p.gotram,
            nakshatra: p.nakshatra,
            heightCm: p.heightCm,
            education: p.education,
            occupation: p.occupation,
            annualIncomeLpa: p.annualIncomeLpa,
            fatherName: p.fatherName,
            contactPhone: p.contactPhone,
            status: 'ACTIVE',
            consentGiven: true,
            uploadedByAdmin: true,
            pdfUploadBatch: BATCH,
          },
        },
      },
    })
    created++
    console.log(`✅ [${p.loginId}] ${p.name}`)
  }

  console.log(`\n🎉 KNBS 2026 seed complete — created: ${created}, skipped: ${skipped}`)
  console.log(`🔑 Login: use 6-digit ID (e.g. 100001) + password "${COMMON_PASSWORD}"`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
