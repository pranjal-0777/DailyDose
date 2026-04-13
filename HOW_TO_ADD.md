# 📖 How to Add New Daily Questions

## 📁 File Structure
```
DailyDoseOfPractise/
├── index.html          → Main website
├── css/styles.css      → All styles
├── js/app.js           → All logic
├── data/
│   ├── dsa.json        → DSA problems
│   ├── lld.json        → Low Level Design
│   └── hld.json        → High Level Design
└── HOW_TO_ADD.md       → This guide
```

---

## ➕ Adding a DSA Question

Open `data/dsa.json` and add a new object to the array:

```json
{
  "id": "dsa-005",
  "date": "2025-04-13",
  "title": "Your Problem Title",
  "category": "DSA",
  "topic": "Topic Name (e.g., Dynamic Programming)",
  "difficulty": "Easy | Medium | Hard",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "description": "Full problem description. Use `backticks` for code and **bold** for emphasis.",
  "examples": [
    {
      "input": "nums = [1,2,3], target = 5",
      "output": "[1,2]",
      "explanation": "Optional explanation of why this is the output."
    }
  ],
  "constraints": [
    "1 <= nums.length <= 1000",
    "-10^9 <= nums[i] <= 10^9"
  ],
  "hints": [
    "First hint here",
    "Second hint here"
  ],
  "solution": {
    "approach": "Approach name (e.g., Two Pointers)",
    "complexity": { "time": "O(n)", "space": "O(1)" },
    "code": "def solution(nums):\n    # your solution\n    pass"
  },
  "leetcodeLink": "https://leetcode.com/problems/your-problem/"
}
```

---

## ➕ Adding an LLD Question

Open `data/lld.json` and add a new object:

```json
{
  "id": "lld-004",
  "date": "2025-04-13",
  "title": "Design a Library Management System",
  "category": "LLD",
  "topic": "OOP Design",
  "difficulty": "Medium",
  "tags": ["OOP", "Design Patterns"],
  "description": "Design a library system...",
  "requirements": {
    "functional": ["Req 1", "Req 2"],
    "nonFunctional": ["NFR 1", "NFR 2"]
  },
  "entities": ["Library", "Book", "Member", "Loan"],
  "designPatterns": ["Singleton (Library)", "Observer (notifications)"],
  "diagram": "Library\n├── Book[]\n└── Member[]",
  "keyClasses": {
    "Library": "Manages books and members",
    "Book": "Has ISBN, title, author, availability"
  },
  "followUpQuestions": [
    "How would you handle concurrent book reservations?",
    "How to implement late fee calculation?"
  ]
}
```

---

## ➕ Adding an HLD Question

Open `data/hld.json` and add a new object:

```json
{
  "id": "hld-004",
  "date": "2025-04-13",
  "title": "Design a Rate Limiter",
  "category": "HLD",
  "topic": "Distributed Systems",
  "difficulty": "Medium",
  "tags": ["Rate Limiting", "Redis", "Algorithms"],
  "description": "Design a rate limiter that limits API calls...",
  "requirements": {
    "functional": ["Limit requests per user", "Support different limits per endpoint"],
    "nonFunctional": ["< 5ms overhead", "Highly available", "Distributed"]
  },
  "estimation": {
    "requestsPerDay": "1B",
    "storagePerUser": "~100B",
    "latencyOverhead": "< 5ms"
  },
  "components": [
    {
      "name": "Rate Limiter Middleware",
      "description": "Intercepts requests, checks Redis counter"
    }
  ],
  "architecture": "Client → Rate Limiter → API Server",
  "tradeoffs": [
    {
      "decision": "Token Bucket vs Sliding Window",
      "pros": "Token Bucket = bursty traffic, Sliding = more accurate",
      "chosen": "Sliding Window Log for accuracy"
    }
  ],
  "bottlenecks": [
    "Race conditions in distributed counter → use Redis INCR (atomic)"
  ],
  "followUpQuestions": [
    "How to handle distributed rate limiting across multiple servers?"
  ]
}
```

---

## 📅 Date Format
Always use `YYYY-MM-DD` format: `"2025-04-13"`

Questions with today's date automatically appear in **"Today's Questions"** section.

## 🎨 Difficulty Levels
- `"Easy"` → Green badge
- `"Medium"` → Yellow/Orange badge  
- `"Hard"` → Red badge

## ✅ Quick Checklist
- [ ] Unique `id` (dsa-00X, lld-00X, hld-00X)
- [ ] Correct `date` format (YYYY-MM-DD)
- [ ] `category` is exactly `"DSA"`, `"LLD"`, or `"HLD"`
- [ ] `difficulty` is exactly `"Easy"`, `"Medium"`, or `"Hard"`
- [ ] Valid JSON (no trailing commas!)
