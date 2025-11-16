import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { trialEmbedSchema, type TrialEmbedFormSchema } from '@/schemas/trialEmbedSchema';
import { TrialEmbedFormData } from '@/types/trialEmbed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

interface StepOneProps {
  initialData: TrialEmbedFormData;
  onNext: (data: TrialEmbedFormData) => Promise<void>;
  isLoading?: boolean;
}

const StepOne = ({ initialData, onNext, isLoading = false }: StepOneProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TrialEmbedFormSchema>({
    resolver: zodResolver(trialEmbedSchema),
    defaultValues: {
      companyName: initialData.companyName || '',
      fullName: initialData.fullName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      plan: initialData.plan,
    },
  });

  const selectedPlan = watch('plan');

  const onSubmit = async (data: TrialEmbedFormData) => {
    await onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Tell us about your business</h2>
        <p className="text-sm text-muted-foreground">Step 1 of 2</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            {...register('companyName')}
            placeholder="Your Company Inc."
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="John Smith"
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@company.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="(555) 123-4567"
            className={errors.phone ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">Canadian format recommended</p>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Select Your Plan *</Label>
          <Select
            value={selectedPlan}
            onValueChange={(value) => setValue('plan', value as TrialEmbedFormData['plan'])}
          >
            <SelectTrigger className={errors.plan ? 'border-destructive' : ''}>
              <SelectValue placeholder="Choose a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">
                Start - ${SUBSCRIPTION_PLANS.start.price}/month
              </SelectItem>
              <SelectItem value="builder">
                Builder - ${SUBSCRIPTION_PLANS.builder.price}/month
              </SelectItem>
              <SelectItem value="builder_pro">
                Builder Pro - ${SUBSCRIPTION_PLANS.builder_pro.price}/month
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.plan && (
            <p className="text-sm text-destructive">{errors.plan.message}</p>
          )}
        </div>
      </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating subscription...
            </>
          ) : (
            'Go to Step #2'
          )}
        </Button>
    </form>
  );
};

export default StepOne;
