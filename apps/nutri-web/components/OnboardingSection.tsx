'use client'

interface OnboardingSectionProps {
  lifeStage: string
  onLifeStageChange: (stage: string) => void
  onComplete: () => void
}

export default function OnboardingSection({ lifeStage, onLifeStageChange, onComplete }: OnboardingSectionProps) {
  const lifeStages = [
    {
      id: 'preconception',
      label: 'Preconception',
      description: 'Planning to conceive or trying to conceive',
      icon: '🤰',
    },
    {
      id: 'pregnancy_trimester1',
      label: 'Pregnancy - Trimester 1',
      description: 'Weeks 1-12 of pregnancy',
      icon: '🌱',
    },
    {
      id: 'pregnancy_trimester2',
      label: 'Pregnancy - Trimester 2',
      description: 'Weeks 13-26 of pregnancy',
      icon: '🌸',
    },
    {
      id: 'pregnancy_trimester3',
      label: 'Pregnancy - Trimester 3',
      description: 'Weeks 27-40+ of pregnancy',
      icon: '🌺',
    },
    {
      id: 'lactation',
      label: 'Lactation',
      description: 'Breastfeeding or pumping',
      icon: '🤱',
    },
    {
      id: 'interpregnancy',
      label: 'Interpregnancy',
      description: 'Between pregnancies',
      icon: '🔄',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Nutrition Tracker! 🎯</h2>
        <p className="text-gray-600">
          Let's set up your nutrition goals based on your current life stage.
        </p>
      </div>

      <div className="space-y-4">
        {lifeStages.map((stage) => (
          <div
            key={stage.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              lifeStage === stage.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onLifeStageChange(stage.id)}
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{stage.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{stage.label}</h3>
                <p className="text-sm text-gray-600">{stage.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                lifeStage === stage.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {lifeStage === stage.id && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to Food Tracking →
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 What you'll get:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Personalized nutrient goals for your life stage</li>
          <li>• Safety warnings for upper limits (ULs)</li>
          <li>• Data from trusted sources (USDA, Nutritionix, Open Food Facts)</li>
          <li>• Weekly progress tracking and recommendations</li>
          <li>• Barcode scanning for easy food entry</li>
        </ul>
      </div>
    </div>
  )
}





