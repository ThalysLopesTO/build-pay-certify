import { useSearchParams } from 'react-router-dom';
import { PlanId } from '@/types/trialEmbed';
import TrialWizard from '@/components/trial-embed/TrialWizard';

const StartTrialEmbedPage = () => {
  const [searchParams] = useSearchParams();
  
  // Read plan from query parameter and validate
  const planParam = searchParams.get('plan');
  const validPlans: PlanId[] = ['start', 'builder', 'builder_pro'];
  
  // Default to 'start' if invalid or missing
  const initialPlan: PlanId = validPlans.includes(planParam as PlanId)
    ? (planParam as PlanId)
    : 'start';

  return <TrialWizard initialPlan={initialPlan} />;
};

export default StartTrialEmbedPage;
