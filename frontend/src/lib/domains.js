// Clinical Domains (Paper 2) and Professional Domains (Paper 1) grouping
// Used across SubjectPicker, StudyByDifficulty, Dashboard, LNA Results

export const CLINICAL_DOMAINS = [
  'Cardiovascular',
  'Respiratory',
  'Gastroenterology / Nutrition',
  'Endocrinology / Metabolic',
  'Psychiatry / Neurology',
  'Musculoskeletal',
  'Infectious Disease / Haematology / Immunology',
  'Renal / Urology',
  'Dermatology / ENT / Eyes',
  'Reproductive',
  'Paediatrics',
  'Pharmacology & Therapeutics',
]

export const PROFESSIONAL_DOMAINS = [
  'Professional Integrity',
  'Coping with Pressure',
  'Empathy & Sensitivity',
]

// Normalised lookup sets for flexible matching
const clinicalSet = new Set(CLINICAL_DOMAINS.map(s => s.toLowerCase()))
const professionalSet = new Set(PROFESSIONAL_DOMAINS.map(s => s.toLowerCase()))

export function isClinicalDomain(subject) {
  return clinicalSet.has(subject.toLowerCase())
}

export function isProfessionalDomain(subject) {
  return professionalSet.has(subject.toLowerCase())
}

// Split an object keyed by subject name into two groups
// Returns { clinical: { [subject]: value }, professional: { [subject]: value }, other: { [subject]: value } }
export function groupByDomain(subjectMap) {
  const clinical = {}
  const professional = {}
  const other = {}

  for (const [subject, value] of Object.entries(subjectMap)) {
    const lower = subject.toLowerCase()
    if (clinicalSet.has(lower)) {
      clinical[subject] = value
    } else if (professionalSet.has(lower)) {
      professional[subject] = value
    } else {
      // Best-effort: check if it partially matches
      const matchesClinical = CLINICAL_DOMAINS.some(d => lower.includes(d.toLowerCase().split(' ')[0]))
      const matchesProfessional = PROFESSIONAL_DOMAINS.some(d => lower.includes(d.toLowerCase().split(' ')[0]))
      if (matchesProfessional) {
        professional[subject] = value
      } else if (matchesClinical) {
        clinical[subject] = value
      } else {
        other[subject] = value
      }
    }
  }

  return { clinical, professional, other }
}

// Split an array of items with a subject property into groups
export function groupArrayByDomain(items, getSubject = (item) => item.subject || item) {
  const clinical = []
  const professional = []
  const other = []

  for (const item of items) {
    const subject = getSubject(item)
    const lower = (subject || '').toLowerCase()
    if (clinicalSet.has(lower) || CLINICAL_DOMAINS.some(d => lower.includes(d.toLowerCase().split(' ')[0]))) {
      clinical.push(item)
    } else if (professionalSet.has(lower) || PROFESSIONAL_DOMAINS.some(d => lower.includes(d.toLowerCase().split(' ')[0]))) {
      professional.push(item)
    } else {
      other.push(item)
    }
  }

  return { clinical, professional, other }
}
