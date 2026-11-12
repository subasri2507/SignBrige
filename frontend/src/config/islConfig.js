export const ISL_CONFIG = {
  signLanguage: "Indian Sign Language",
  code: "ISL",
  phase: 1,

  // 9 Supported Spoken Languages (Indian Regional + International)
  spokenLanguages: [
    { code: "en", name: "English", nativeName: "English", bcp47: "en-IN", flag: "🇬🇧" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN", flag: "🇮🇳" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN", flag: "🇮🇳" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN", flag: "🇮🇳" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN", flag: "🇮🇳" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN", flag: "🇮🇳" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN", flag: "🇮🇳" }
  ],

  // Supported Sign Languages & Regional ISL Dialect Variants
  signLanguages: [
    {
      code: "ISL",
      name: "ISL — National Standard (ISLRTC)",
      shortName: "ISL (National)",
      region: "All India (ISLRTC)",
      badge: "Primary"
    },
    {
      code: "ISL_SOUTH",
      name: "ISL — Southern Regional Dialect",
      shortName: "ISL (South)",
      region: "Tamil Nadu / Karnataka / Kerala / Telugu States",
      badge: "Regional"
    },
    {
      code: "ISL_NORTH",
      name: "ISL — Northern & Western Dialect",
      shortName: "ISL (North/West)",
      region: "Delhi / Maharashtra / Gujarat / Bengal",
      badge: "Regional"
    },
    {
      code: "ASL",
      name: "American Sign Language (ASL Bridge)",
      shortName: "ASL Bridge",
      region: "International / North America",
      badge: "Bridge"
    },
    {
      code: "BSL",
      name: "British Sign Language (BSL Bridge)",
      shortName: "BSL Bridge",
      region: "Commonwealth / UK",
      badge: "Bridge"
    }
  ],

  // Categories for filtering the 74 signs
  categories: [
    "All",
    "Greeting",
    "Courtesy",
    "Pronoun",
    "Family",
    "Question",
    "Response",
    "Education",
    "Emergency",
    "Daily Need",
    "Emotion",
    "Evaluation",
    "Action",
    "Time"
  ],

  // 74 Supported ISL Vocabulary Signs across 13 functional categories
  supportedGlosses: [
    // Greetings & Courtesy (10)
    { gloss: "NAMASTE", label: "Namaste / Vanakkam", category: "Greeting", icon: "🙏" },
    { gloss: "HELLO", label: "Hello / Hi", category: "Greeting", icon: "👋" },
    { gloss: "MORNING", label: "Good Morning", category: "Greeting", icon: "🌅" },
    { gloss: "AFTERNOON", label: "Good Afternoon", category: "Greeting", icon: "☀️" },
    { gloss: "EVENING", label: "Good Evening", category: "Greeting", icon: "🌇" },
    { gloss: "NIGHT", label: "Good Night", category: "Greeting", icon: "🌙" },
    { gloss: "GOODBYE", label: "Goodbye / Bye", category: "Greeting", icon: "👋" },
    { gloss: "WELCOME", label: "Welcome", category: "Courtesy", icon: "👐" },
    { gloss: "THANK_YOU", label: "Thank You", category: "Courtesy", icon: "🤝" },
    { gloss: "PLEASE", label: "Please", category: "Courtesy", icon: "🤲" },

    // Pronouns & Family / People (12)
    { gloss: "I", label: "I / Me / My", category: "Pronoun", icon: "👤" },
    { gloss: "YOU", label: "You / Your", category: "Pronoun", icon: "👉" },
    { gloss: "WE", label: "We / Us / Our", category: "Pronoun", icon: "👥" },
    { gloss: "THEY", label: "They / Them", category: "Pronoun", icon: "👨‍👩‍👧" },
    { gloss: "HE", label: "He / Him", category: "Pronoun", icon: "👨" },
    { gloss: "SHE", label: "She / Her", category: "Pronoun", icon: "👩" },
    { gloss: "MOTHER", label: "Mother / Amma", category: "Family", icon: "🤱" },
    { gloss: "FATHER", label: "Father / Appa", category: "Family", icon: "👨‍👧" },
    { gloss: "BROTHER", label: "Brother / Anna", category: "Family", icon: "👦" },
    { gloss: "SISTER", label: "Sister / Akka", category: "Family", icon: "👧" },
    { gloss: "FRIEND", label: "Friend", category: "Family", icon: "🫂" },
    { gloss: "FAMILY", label: "Family", category: "Family", icon: "🏠" },

    // Questions & Responses (10)
    { gloss: "YES", label: "Yes / Agree", category: "Response", icon: "✅" },
    { gloss: "NO", label: "No / Disagree", category: "Response", icon: "❌" },
    { gloss: "WHAT", label: "What?", category: "Question", icon: "❓" },
    { gloss: "WHERE", label: "Where?", category: "Question", icon: "📍" },
    { gloss: "WHEN", label: "When?", category: "Question", icon: "🕒" },
    { gloss: "WHY", label: "Why?", category: "Question", icon: "🤔" },
    { gloss: "WHO", label: "Who?", category: "Question", icon: "🕵️" },
    { gloss: "HOW", label: "How?", category: "Question", icon: "⚙️" },
    { gloss: "HOW_MUCH", label: "How Much / Many", category: "Question", icon: "🔢" },
    { gloss: "WHICH", label: "Which?", category: "Question", icon: "↔️" },

    // Education & Classroom (10)
    { gloss: "TEACHER", label: "Teacher / Professor", category: "Education", icon: "🧑‍🏫" },
    { gloss: "STUDENT", label: "Student / Learner", category: "Education", icon: "🎒" },
    { gloss: "CLASSROOM", label: "Classroom", category: "Education", icon: "🏫" },
    { gloss: "SCHOOL", label: "School", category: "Education", icon: "🏢" },
    { gloss: "COLLEGE", label: "College / University", category: "Education", icon: "🎓" },
    { gloss: "BOOK", label: "Book / Textbook", category: "Education", icon: "📖" },
    { gloss: "WRITE", label: "Write / Note", category: "Education", icon: "✍️" },
    { gloss: "READ", label: "Read", category: "Education", icon: "📚" },
    { gloss: "STUDY", label: "Study / Learn", category: "Education", icon: "📝" },
    { gloss: "EXAM", label: "Exam / Test", category: "Education", icon: "📋" },

    // Emergency, Health & Daily Needs (10)
    { gloss: "HELP", label: "Help / Assist", category: "Emergency", icon: "🆘" },
    { gloss: "DOCTOR", label: "Doctor / Physician", category: "Emergency", icon: "🩺" },
    { gloss: "HOSPITAL", label: "Hospital / Clinic", category: "Emergency", icon: "🏥" },
    { gloss: "MEDICINE", label: "Medicine / Tablet", category: "Emergency", icon: "💊" },
    { gloss: "PAIN", label: "Pain / Hurt", category: "Emergency", icon: "🤕" },
    { gloss: "EMERGENCY", label: "Emergency / Urgent", category: "Emergency", icon: "🚨" },
    { gloss: "WATER", label: "Water / Drink", category: "Daily Need", icon: "💧" },
    { gloss: "FOOD", label: "Food / Meal / Eat", category: "Daily Need", icon: "🍲" },
    { gloss: "RESTROOM", label: "Restroom / Toilet", category: "Daily Need", icon: "🚻" },
    { gloss: "HOME", label: "Home / House", category: "Daily Need", icon: "🏡" },

    // Emotions & Evaluations (8)
    { gloss: "GOOD", label: "Good / Fine", category: "Evaluation", icon: "👍" },
    { gloss: "BAD", label: "Bad / Poor", category: "Evaluation", icon: "👎" },
    { gloss: "HAPPY", label: "Happy / Glad", category: "Emotion", icon: "😊" },
    { gloss: "SAD", label: "Sad / Unhappy", category: "Emotion", icon: "😢" },
    { gloss: "TIRED", label: "Tired / Exhausted", category: "Emotion", icon: "😴" },
    { gloss: "ANGRY", label: "Angry / Upset", category: "Emotion", icon: "😠" },
    { gloss: "SORRY", label: "Sorry / Apologize", category: "Courtesy", icon: "🙇" },
    { gloss: "LOVE", label: "Love / Care", category: "Emotion", icon: "❤️" },

    // Actions & Mental Verbs (8)
    { gloss: "UNDERSTAND", label: "Understand / Know", category: "Action", icon: "💡" },
    { gloss: "NEED", label: "Need / Require", category: "Action", icon: "📌" },
    { gloss: "WANT", label: "Want / Wish", category: "Action", icon: "✨" },
    { gloss: "COME", label: "Come Here", category: "Action", icon: "🫴" },
    { gloss: "GO", label: "Go / Leave", category: "Action", icon: "🚶" },
    { gloss: "WAIT", label: "Wait / Hold On", category: "Action", icon: "✋" },
    { gloss: "STOP", label: "Stop / Halt", category: "Action", icon: "🛑" },
    { gloss: "WORK", label: "Work / Job", category: "Action", icon: "💼" },

    // Time & Everyday Concepts (6)
    { gloss: "TODAY", label: "Today", category: "Time", icon: "📅" },
    { gloss: "TOMORROW", label: "Tomorrow", category: "Time", icon: "⏭️" },
    { gloss: "YESTERDAY", label: "Yesterday", category: "Time", icon: "⏮️" },
    { gloss: "NOW", label: "Now / Immediately", category: "Time", icon: "⏱️" },
    { gloss: "TIME", label: "Time / Clock", category: "Time", icon: "⌚" },
    { gloss: "NAME", label: "Name", category: "Greeting", icon: "🪪" }
  ],

  confidenceThresholds: {
    high: 0.75,
    medium: 0.50,
    low: 0.30
  },

  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
};

export function getBcp47Tag(langCode) {
  const found = ISL_CONFIG.spokenLanguages.find((l) => l.code === langCode);
  return found ? found.bcp47 : "en-IN";
}

export function getLanguageLabel(langCode) {
  const found = ISL_CONFIG.spokenLanguages.find((l) => l.code === langCode);
  return found ? `${found.name} (${found.nativeName})` : langCode;
}
