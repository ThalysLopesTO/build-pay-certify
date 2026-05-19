import { useSearchParams } from 'react-router-dom';
import { PlanId } from '@/types/trialEmbed';
import TrialWizard from '@/components/trial-embed/TrialWizard';
import SEO from '@/components/common/SEO';

const StartTrialEmbedPage = () => {
  const [searchParams] = useSearchParams();

  const planParam = searchParams.get('plan');
  const validPlans: PlanId[] = ['start', 'builder', 'builder_pro'];

  const initialPlan: PlanId = validPlans.includes(planParam as PlanId)
    ? (planParam as PlanId)
    : 'start';

  return (
    <>
      <SEO
        title="Start Your Free Trial | StackBuild"
        description="Start a free StackBuild trial — construction payroll, timesheets, jobsite tracking, and safety certs in one platform."
        path="/start-trial-embed"
      />
      <TrialWizard initialPlan={initialPlan} />
    </>
  );
};

export default StartTrialEmbedPage;
