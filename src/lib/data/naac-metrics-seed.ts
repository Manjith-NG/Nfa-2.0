import type { InputProcessOutcome } from "@prisma/client";

export type NaacCriterionSeed = {
  number: number;
  title: string;
  inputProcessOutcome: InputProcessOutcome;
  metrics: { code: string; title: string; description: string }[];
};

/** Master NAAC criteria + metrics — add rows here or in DB; re-run seed to sync. */
export const NAAC_CRITERIA_SEED: NaacCriterionSeed[] = [
  {
    number: 1,
    title: "Curriculum Design",
    inputProcessOutcome: "INPUT",
    metrics: [
      {
        code: "1.1",
        title: "Outcome-based curriculum",
        description:
          "Curriculum framework is aligned to Program Outcomes (POs), Program Specific Outcomes (PSOs) and Course Outcomes (COs).",
      },
      {
        code: "1.2",
        title: "Stakeholder Participation",
        description:
          "Stakeholders including students, alumni, employers and faculty participate in curriculum design and review.",
      },
      {
        code: "1.3",
        title: "Curriculum Flexibility",
        description:
          "Curriculum provides flexibility, choice-based credit system and multiple entry/exit options where applicable.",
      },
      {
        code: "1.4",
        title: "Skill Orientation",
        description:
          "Curriculum integrates employability, entrepreneurship and life skills through structured components.",
      },
      {
        code: "1.5",
        title: "Multidisciplinary approach",
        description:
          "Programs encourage multidisciplinary and interdisciplinary learning through courses and projects.",
      },
      {
        code: "1.6",
        title: "Academic calendar adherence",
        description:
          "Academic calendar is prepared and adhered to for timely completion of academic activities.",
      },
      {
        code: "1.7",
        title: "Feedback on curriculum",
        description:
          "Structured feedback on curriculum is collected from stakeholders and used for revision.",
      },
      {
        code: "1.8",
        title: "Curriculum enrichment",
        description:
          "Value-added and enrichment courses supplement the core curriculum for holistic development.",
      },
    ],
  },
  {
    number: 2,
    title: "Faculty Resources",
    inputProcessOutcome: "INPUT",
    metrics: [
      {
        code: "2.1",
        title: "Recruitment",
        description:
          "Faculty recruitment practices follow UGC/AICTE/State norms with transparency and merit-based selection.",
      },
      {
        code: "2.2",
        title: "Pay and Allowances",
        description:
          "Faculty are paid as per statutory norms with timely disbursement of salary and allowances.",
      },
      {
        code: "2.3",
        title: "Faculty Development",
        description:
          "Faculty participate in professional development programs, FDPs, seminars and workshops.",
      },
      {
        code: "2.4",
        title: "Faculty Diversity",
        description:
          "Institution maintains diversity in faculty recruitment across gender and categories.",
      },
      {
        code: "2.5",
        title: "Faculty Retention",
        description:
          "Measures are in place to retain qualified faculty and reduce attrition.",
      },
      {
        code: "2.6",
        title: "Faculty Student Ratio",
        description:
          "Faculty-student ratio is maintained as per regulatory requirements for quality teaching.",
      },
    ],
  },
  {
    number: 3,
    title: "Infrastructure",
    inputProcessOutcome: "INPUT",
    metrics: [
      {
        code: "3.1",
        title: "Physical Infrastructure",
        description:
          "Adequate classrooms, laboratories, seminar halls and administrative spaces are available.",
      },
      {
        code: "3.2",
        title: "Learning Resources",
        description:
          "Library, e-resources, journals and learning materials support academic programs.",
      },
      {
        code: "3.3",
        title: "IT Infrastructure",
        description:
          "Computing facilities, internet connectivity and digital tools support teaching and administration.",
      },
      {
        code: "3.4",
        title: "Innovation Resources",
        description:
          "Incubation, maker spaces and innovation facilities support student and faculty projects.",
      },
      {
        code: "3.5",
        title: "Maintenance of infrastructure",
        description:
          "Infrastructure is maintained through periodic upkeep and annual maintenance budgets.",
      },
      {
        code: "3.6",
        title: "Optimal usage of infrastructure",
        description:
          "Physical and digital infrastructure is utilized optimally through scheduling and monitoring.",
      },
    ],
  },
  {
    number: 4,
    title: "Financial Resources & Management",
    inputProcessOutcome: "INPUT",
    metrics: [
      {
        code: "4.1",
        title: "Capital Income",
        description:
          "Capital grants and funding are mobilized for infrastructure and development projects.",
      },
      {
        code: "4.2",
        title: "Revenue Expenditure",
        description:
          "Revenue expenditure on academic and administrative activities is planned and monitored.",
      },
      {
        code: "4.3",
        title: "Financial Controls & Risk Management",
        description:
          "Internal controls, audits and risk management practices ensure financial integrity.",
      },
      {
        code: "4.4",
        title: "Internal and external audit",
        description:
          "Regular internal and external audits are conducted and findings are acted upon.",
      },
      {
        code: "4.5",
        title: "Budget allocation and utilization",
        description:
          "Budgets are allocated department-wise and utilization is tracked against plans.",
      },
      {
        code: "4.6",
        title: "Resource mobilization",
        description:
          "Institution mobilizes funds through grants, donations, consultancy and other sources.",
      },
    ],
  },
  {
    number: 5,
    title: "Learning & Teaching",
    inputProcessOutcome: "PROCESS",
    metrics: [
      {
        code: "5.1",
        title: "Pedagogical Approaches",
        description:
          "Student-centric pedagogical approaches including active learning are practiced in classrooms.",
      },
      {
        code: "5.2",
        title: "Internships",
        description:
          "Students undertake internships, field projects and industry exposure as part of learning.",
      },
      {
        code: "5.3",
        title: "Assessment",
        description:
          "Continuous assessment, rubrics and outcome-based evaluation methods are implemented.",
      },
      {
        code: "5.4",
        title: "Learning Management System",
        description:
          "LMS and digital platforms support course delivery, assignments and student engagement.",
      },
      {
        code: "5.5",
        title: "Student-centric methods",
        description:
          "Teaching methods address diverse learning needs through tutorials, mentoring and remedial support.",
      },
      {
        code: "5.6",
        title: "Experiential learning",
        description:
          "Experiential learning through labs, projects and practical work reinforces theoretical concepts.",
      },
      {
        code: "5.7",
        title: "Continuous internal evaluation",
        description:
          "Internal evaluation is continuous, transparent and aligned with course outcomes.",
      },
    ],
  },
  {
    number: 6,
    title: "Extended Curricular Engagements",
    inputProcessOutcome: "PROCESS",
    metrics: [
      {
        code: "6.1",
        title: "Technical/Domain Clubs",
        description:
          "Technical and domain clubs promote peer learning, competitions and skill development.",
      },
      {
        code: "6.2",
        title: "Hackathons",
        description:
          "Hackathons, coding events and innovation challenges engage students beyond the curriculum.",
      },
      {
        code: "6.3",
        title: "Cultural Clubs",
        description:
          "Cultural clubs and activities foster creativity, teamwork and inclusive participation.",
      },
      {
        code: "6.4",
        title: "Sports Clubs and Activities",
        description:
          "Sports clubs and activities promote physical fitness and institutional sports culture.",
      },
      {
        code: "6.5",
        title: "Sports participation and institutional achievements",
        description:
          "Sports participation and institutional achievements in inter-collegiate events are documented.",
      },
      {
        code: "6.6",
        title: "Extended Curricular Engagements",
        description:
          "Extended curricular engagements including NSS, NCC and outreach complement formal learning.",
      },
    ],
  },
  {
    number: 7,
    title: "Governance & Administration",
    inputProcessOutcome: "PROCESS",
    metrics: [
      {
        code: "7.1",
        title: "Statutory Compliance",
        description:
          "Institution complies with statutory bodies, affiliating university and regulatory requirements.",
      },
      {
        code: "7.2",
        title: "E-Governance",
        description:
          "E-governance systems support admissions, examinations, finance and administration.",
      },
      {
        code: "7.3",
        title: "Student & Employee Welfare",
        description:
          "Welfare measures for students and employees include scholarships, health and support services.",
      },
      {
        code: "7.4",
        title: "Effective Leadership",
        description:
          "Leadership provides vision, decentralization and participatory decision-making.",
      },
      {
        code: "7.5",
        title: "Quality Assurance System",
        description:
          "IQAC and internal quality assurance mechanisms monitor and improve institutional processes.",
      },
      {
        code: "7.6",
        title: "Strategic plan and deployment",
        description:
          "Strategic plan is documented, communicated and deployed through actionable initiatives.",
      },
      {
        code: "7.7",
        title: "Transparent admission process",
        description:
          "Admissions follow transparent, merit-based and documented procedures.",
      },
      {
        code: "7.8",
        title: "Grievance redressal",
        description:
          "Grievance redressal mechanisms address student and staff concerns in a time-bound manner.",
      },
    ],
  },
  {
    number: 8,
    title: "Student Outcomes",
    inputProcessOutcome: "OUTCOME",
    metrics: [
      {
        code: "8.1",
        title: "Academic Progression",
        description:
          "Students progress academically with acceptable pass rates and progression to higher semesters.",
      },
      {
        code: "8.2",
        title: "Placement and Employment",
        description:
          "Graduates secure placements, entrepreneurship or meaningful employment after completion.",
      },
      {
        code: "8.3",
        title: "Competitive Exams",
        description:
          "Students qualify in competitive examinations and professional certification tests.",
      },
      {
        code: "8.4",
        title: "Graduation Rate",
        description:
          "Graduation rate reflects successful completion of programs within stipulated time.",
      },
      {
        code: "8.5",
        title: "Higher education progression",
        description:
          "Graduates pursue higher education in reputed institutions in India and abroad.",
      },
      {
        code: "8.6",
        title: "Alumni engagement",
        description:
          "Alumni contribute through mentoring, placements, feedback and institutional support.",
      },
      {
        code: "8.7",
        title: "Student satisfaction",
        description:
          "Student satisfaction surveys inform improvements in teaching, facilities and services.",
      },
      {
        code: "8.8",
        title: "Awards and recognition",
        description:
          "Students receive awards and recognition in academic, sports and co-curricular domains.",
      },
    ],
  },
  {
    number: 9,
    title: "Research & Innovation Outcomes",
    inputProcessOutcome: "OUTCOME",
    metrics: [
      {
        code: "9.1",
        title: "External Research Grants",
        description:
          "Faculty mobilize external research grants from funding agencies and industry.",
      },
      {
        code: "9.2",
        title: "Research Publications",
        description:
          "Research publications in peer-reviewed journals and conferences are documented.",
      },
      {
        code: "9.3",
        title: "PhDs Awarded",
        description:
          "PhDs awarded under faculty guidance contribute to research capacity building.",
      },
      {
        code: "9.4",
        title: "IPRs Produced",
        description:
          "Patents, copyrights and other IPRs generated reflect innovation outcomes.",
      },
      {
        code: "9.5",
        title: "Research projects",
        description:
          "Ongoing and completed research projects address societal and academic challenges.",
      },
      {
        code: "9.6",
        title: "Consultancy and extension",
        description:
          "Faculty undertake consultancy and extension activities benefiting stakeholders.",
      },
      {
        code: "9.7",
        title: "Research facilities",
        description:
          "Research laboratories and facilities support faculty and student research.",
      },
      {
        code: "9.8",
        title: "Collaborations for research",
        description:
          "MoUs and collaborations with industry and academia strengthen research ecosystem.",
      },
    ],
  },
  {
    number: 10,
    title: "Sustainability Outcomes",
    inputProcessOutcome: "OUTCOME",
    metrics: [
      {
        code: "10.1",
        title: "Community Activities",
        description:
          "Community engagement and outreach programs address local developmental needs.",
      },
      {
        code: "10.2",
        title: "Waste and Water Management",
        description:
          "Waste segregation, recycling and water conservation practices are implemented on campus.",
      },
      {
        code: "10.3",
        title: "Green Audits and Initiatives",
        description:
          "Green audits and environmental initiatives promote sustainable campus operations.",
      },
      {
        code: "10.4",
        title: "Environmental consciousness",
        description:
          "Programs build environmental consciousness among students and staff.",
      },
      {
        code: "10.5",
        title: "Industry/NGO Collaborations",
        description:
          "Collaborations with industry and NGOs support sustainability and social impact projects.",
      },
    ],
  },
];
