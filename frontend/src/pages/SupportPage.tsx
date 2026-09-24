import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitSupportRequest } from '../api/support';
import { getErrorMessage } from '../api/client';
import { Card, Button, Input, Textarea, Breadcrumbs } from '../components/common';

const supportSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Maximum 200 characters'),
  message: z.string().min(1, 'Message is required').max(4000, 'Maximum 4000 characters'),
});

type SupportForm = z.infer<typeof supportSchema>;

export function SupportPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
  });

  const submitMutation = useMutation({
    mutationFn: submitSupportRequest,
    onSuccess: () => {
      setSubmitted(true);
      reset();
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: SupportForm) => {
    setServerError(null);
    setSubmitted(false);
    submitMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Support' }]} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Support</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Report a problem or ask a question — this goes straight to our team.
        </p>
      </header>

      <Card>
        {submitted && (
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            Your support query has been submitted. We'll get back to you soon.
          </div>
        )}
        {serverError && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Subject"
            placeholder="e.g. Can't submit attendance for my class"
            {...register('subject')}
            error={errors.subject?.message}
          />

          <Textarea
            label="Message"
            rows={6}
            placeholder="Describe the issue or question in detail..."
            {...register('message')}
            error={errors.message?.message}
          />

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button type="submit" isLoading={submitMutation.isPending} className="px-10">
              Submit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
