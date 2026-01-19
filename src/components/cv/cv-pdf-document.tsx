/**
 * CV PDF Document Component
 * Uses @react-pdf/renderer to generate PDF
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { format } from 'date-fns'

// Register fonts (optional, using default for now)
// Font.register({ family: 'Inter', src: '...' })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 4,
  },
  summary: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    fontSize: 9,
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    padding: '4 8',
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  experienceOrg: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
  },
  experienceDate: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  experienceDesc: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
    lineHeight: 1.4,
  },
  achievementItem: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 6,
    flexDirection: 'row',
  },
  bullet: {
    marginRight: 6,
  },
})

interface CVData {
  profile: any
  skills: any[]
  education: any[]
  experience: any[]
  achievements: any[]
}

export function CVPDFDocument({ data }: { data: CVData }) {
  const { profile, skills, education, experience, achievements } = data

  // Group skills by type
  const hardSkills = skills.filter((s) => s.skill.type === 'HARD_SKILL')
  const softSkills = skills.filter((s) => s.skill.type === 'SOFT_SKILL')

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Present'
    try {
      return format(new Date(dateStr), 'MM/yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName}</Text>
          {profile.email && (
            <Text style={styles.contactInfo}>Email: {profile.email}</Text>
          )}
          {profile.phone && (
            <Text style={styles.contactInfo}>Phone: {profile.phone}</Text>
          )}
          {profile.address && (
            <Text style={styles.contactInfo}>Address: {profile.address}</Text>
          )}
        </View>

        {/* Summary */}
        {profile.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{profile.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            
            {hardSkills.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                  Technical Skills
                </Text>
                <View style={styles.skillsContainer}>
                  {hardSkills.map((item, idx) => (
                    <Text key={idx} style={styles.skillItem}>
                      {item.skill.name} ({item.level?.name})
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {softSkills.length > 0 && (
              <View>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                  Soft Skills
                </Text>
                <View style={styles.skillsContainer}>
                  {softSkills.map((item, idx) => (
                    <Text key={idx} style={styles.skillItem}>
                      {item.skill.name} ({item.level?.name})
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((item, idx) => (
              <View key={idx} style={styles.experienceItem}>
                <Text style={styles.experienceTitle}>{item.title}</Text>
                <Text style={styles.experienceOrg}>{item.institution}</Text>
                <Text style={styles.experienceDate}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
                {item.description && (
                  <Text style={styles.experienceDesc}>{item.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((item, idx) => (
              <View key={idx} style={styles.experienceItem}>
                <Text style={styles.experienceTitle}>{item.title}</Text>
                <Text style={styles.experienceOrg}>{item.institution}</Text>
                <Text style={styles.experienceDate}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
                {item.description && (
                  <Text style={styles.experienceDesc}>{item.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements & Certifications</Text>
            {achievements.map((item, idx) => (
              <View key={idx} style={styles.achievementItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>
                  {item.title} ({item.type}) - {formatDate(item.issuedDate)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
