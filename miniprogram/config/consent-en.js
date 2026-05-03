// English translation of the consent form for dev/internal review only.
// NEVER shown to participants — only displayed in dev mode below the
// Chinese version, mirroring the dev-only English block on article pages.

const CONSENT_CONFIG_EN = {
  topHeader:
    "Before using this program, we need your informed consent. Please read the consent form below and tap “I Agree” to take part in this study:",

  title: "Informed Consent Form",

  sections: [
    {
      heading: "Study Introduction and Purpose",
      paragraphs: [
        "We are conducting a study on Chinese residents' use of the internet and their engagement with environmental issues. The study aims to explore how new communication technologies affect access to information and motivate pro-environmental behavior. Findings will be used for teaching, scholarly publication, and academic conference presentations.",
        "**Project title:** Tracking Carbon Footprints Together: A Study on Digital Tools and Environmental Engagement.",
        "**Principal investigator:** Dr. Charles Chang, Assistant Professor of Environmental and Urban Studies, Duke Kunshan University. Address: 8 Duke Avenue, Kunshan, Suzhou, Jiangsu, China, 215316. Email: charles.c.chang@dukekunshan.edu.cn.",
        "If you have questions or concerns about your rights as a participant, you may contact the Duke Kunshan University Institutional Review Board: dku_irb@dukekunshan.edu.cn.",
      ],
    },
    {
      heading: "Study Procedure",
      paragraphs: [
        "Participation requires installing and using the WeChat mini program “Low-Carbon Travel Helper” to record your travel modes (e.g., cycling, ride-hailing, public transit). Please start the recorder when a trip begins, stop it when the trip ends, and report the travel mode honestly. Truthful reporting is important for the study's accuracy.",
        "**You will receive 1 RMB upon registration. After completing the study, you may receive a second reward through a lottery, ranging from 5 RMB to a maximum of 1,000 RMB. To complete the study you must record three trips and complete a short questionnaire.**",
        "We will also ask you to authorize collection of additional data through the mini program, including your WeChat ID, in-app interactions, and the survey responses you provide at the end of the study.",
        "Some questions in the survey may use unfamiliar formats; please answer in whatever way you find most appropriate. Your responses will be analyzed using established scientific methods.",
      ],
    },
    {
      heading: "Confidentiality and Personal Data Handling",
      paragraphs: [
        "We take the protection of your personal information seriously and apply technical and organizational safeguards to prevent leakage, tampering, or unauthorized access. We comply with the Personal Information Protection Law of the People's Republic of China and related regulations, and only collect the minimum personal data necessary for the study.",
        "All information you provide will be kept strictly confidential, used only for this study, and not disclosed to any unauthorized third party. We will not analyze data at the individual level; results will be reported only in aggregate, in a form that cannot identify any specific participant.",
        "Identifiable information (such as your WeChat ID) will be used only for data matching and tracking, never to identify you personally. Identifiers will be anonymized as soon as data collection ends, and all raw data will be securely deleted at the end of the project.",
        "All study data will be stored on encrypted servers that meet security requirements; only authorized members of the research team will have access. Any short-term retention of contact information will be stored separately from the rest of the research data and encrypted. At the end of the study, all data will be destroyed in accordance with legal and ethical requirements.",
        "You retain the right to be informed about, decide on, access, correct, and delete your personal information. Please contact the research team at any time if you wish to exercise these rights.",
      ],
    },
    {
      heading: "Voluntary Participation and Right to Withdraw",
      paragraphs: [
        "Participation is entirely voluntary; we will not collect any data without your consent. The study runs for roughly one day and you may withdraw at any time without penalty. To withdraw, you can email us or send a message through the mini program's message center.",
      ],
    },
    {
      heading: "Questions",
      paragraphs: [
        "If you have any questions about your rights as a participant or about the review of this study, you may contact the principal investigator, Dr. Charles Chang, Department of Environmental and Urban Studies, Duke Kunshan University, at charles.c.chang@dukekunshan.edu.cn.",
      ],
    },
    {
      heading: "Confirmation of Consent",
      paragraphs: [
        "I confirm that I have read and understood the information above about this study and have had the opportunity to ask questions. If I have other questions, I know whom to contact.",
        "I **agree / do not agree** to participate in the study above, and I authorize the “Low-Carbon Travel Helper” mini program to use the data it collects within the scope described above.",
        "Thank you for your cooperation. Let's get started!",
      ],
    },
  ],

  buttons: {
    agree: "I agree",
    disagree: "I disagree",
  },
}

module.exports = { CONSENT_CONFIG_EN }
