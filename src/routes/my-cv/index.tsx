/**
 * My CV Page
 * Preview and export CV as PDF
 */
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Download, FileText, AlertCircle } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { getCVDataFn } from '@/server/cv.server'
import { useAuthStore } from '@/store/auth.store'
import { CVPreview } from '@/components/cv/cv-preview'
import { CVPDFDocument } from '@/components/cv/cv-pdf-document'
import { EditSummaryDialog } from '@/components/cv/edit-summary-dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export const Route = createFileRoute('/my-cv/')({
  component: MyCVPage,
})

function MyCVPage() {
  const token = useAuthStore((state: any) => state.token)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch CV Data
  const { data: cvResult } = useSuspenseQuery({
    queryKey: ['cv-data'],
    queryFn: () => getCVDataFn({ data: { token: token! } }),
  })

  const cvData = cvResult.data

  // Check data completeness
  const hasProfile = !!cvData.profile
  const hasSkills = cvData.skills.length > 0
  const hasExperience = cvData.experience.length > 0
  const hasEducation = cvData.education.length > 0

  const isComplete = hasProfile && (hasSkills || hasExperience || hasEducation)

  // Export PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      toast.info('Generating PDF...')

      const blob = await pdf(<CVPDFDocument data={cvData} />).toBlob()
      saveAs(blob, `CV_${cvData.profile.fullName.replace(/\s+/g, '_')}.pdf`)

      toast.success('PDF downloaded successfully!')
    } catch (error: any) {
      console.error('PDF Export Error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            My CV
          </h1>
          <p className="text-muted-foreground mt-2">
            Preview and export your professional CV
          </p>
        </div>
        <div className="flex gap-2">
          <EditSummaryDialog currentSummary={cvData.profile.summary} />
          <Button 
            onClick={handleExportPDF} 
            disabled={!isComplete || isExporting}
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {!isComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your CV is incomplete. Please add:
            {!hasSkills && ' Skills,'}
            {!hasExperience && ' Work Experience,'}
            {!hasEducation && ' Education'}
            {' '}to make it more professional.
          </AlertDescription>
        </Alert>
      )}

      {!cvData.profile.summary && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add a professional summary to make your CV stand out! Click "Edit Summary" above.
          </AlertDescription>
        </Alert>
      )}

      {/* CV Preview */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <CVPreview data={cvData} />
      </div>
    </div>
  )
}
