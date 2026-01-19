/**
 * CV Preview Component (Web Version)
 * Mirrors the PDF layout for WYSIWYG experience
 */
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface CVData {
  profile: any
  skills: any[]
  education: any[]
  experience: any[]
  achievements: any[]
}

export function CVPreview({ data }: { data: CVData }) {
  const { profile, skills, education, experience, achievements } = data

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
    <Card className="max-w-4xl mx-auto p-10 bg-white shadow-lg">
      {/* Header */}
      <div className="border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
          {profile.dob && <div>DOB: {formatDate(profile.dob)}</div>}
          {profile.gender && <div>Gender: {profile.gender}</div>}
          {profile.email && <div>Email: {profile.email}</div>}
          {profile.phone && <div>Phone: {profile.phone}</div>}
          {profile.address && <div className="w-full">Address: {profile.address}</div>}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-primary border-b border-gray-200 pb-2 mb-3">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-primary border-b border-gray-200 pb-2 mb-3">
            Skills
          </h2>
          
          {hardSkills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {item.skill.name} ({item.level?.name})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {softSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {item.skill.name} ({item.level?.name})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-primary border-b border-gray-200 pb-2 mb-3">
            Work Experience
          </h2>
          {experience.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-bold text-gray-900">{item.positionMajor}</h3>
              <p className="text-sm text-gray-700 italic font-medium">{item.organizationName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </p>
              {item.description && (
                <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-primary border-b border-gray-200 pb-2 mb-3">
            Education
          </h2>
          {education.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-bold text-gray-900">{item.organizationName}</h3>
              <p className="text-sm text-gray-700 italic font-medium">{item.positionMajor}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </p>
              {item.description && (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{item.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-primary border-b border-gray-200 pb-2 mb-3">
            Achievements & Certifications
          </h2>
          <ul className="list-disc list-inside space-y-2">
            {achievements.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                {item.title} ({item.type}) - {formatDate(item.issuedDate)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  )
}
