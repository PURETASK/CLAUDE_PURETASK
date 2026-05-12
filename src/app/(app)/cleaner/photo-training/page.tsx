import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ICONS } from '@/lib/assets';

async function completePhotoTraining(formData: FormData) {
  'use server';
  const { saveStepAction } = await import('@/features/cleaner/actions');
  await saveStepAction('9', { ok: false, error: null }, formData);
  redirect('/cleaner/apply/step-9');
}

const SECTIONS = [
  {
    title: 'Why photos matter',
    icon: ICONS.cleaning,
    body: 'Customers rely on before-and-after photos to confirm work quality and protect both parties in case of disputes. Every completed room requires at least one photo.',
  },
  {
    title: 'What to photograph',
    icon: ICONS.checkmark,
    items: [
      'Every room you clean — take a photo after finishing',
      'Any pre-existing damage before you start work',
      'Entryways and exits when you arrive and leave',
      'Specialty items like stovetops, ovens, and bathrooms',
    ],
  },
  {
    title: 'Photo quality standards',
    icon: ICONS.checkmark,
    items: [
      'Well-lit — open blinds or turn on lights',
      'In-focus — wait for autofocus before shooting',
      'Wide enough to show the full room or surface',
      'Landscape orientation preferred',
    ],
  },
  {
    title: 'What NOT to photograph',
    icon: ICONS.contacts,
    items: [
      'People — never photograph customers or their guests',
      'Personal documents, mail, or financial papers',
      'Valuables such as jewelry, cash, or electronics close-up',
      'Anything outside the areas you are cleaning',
    ],
  },
  {
    title: 'Privacy rules',
    icon: ICONS.checkmark,
    body: 'All photos are uploaded directly to PureTask and are never stored on your device. Customers can see their own photos but photos are never shared publicly. Violations of privacy rules result in immediate account suspension.',
  },
] as const;

const PhotoTrainingPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/cleaner/apply" className="text-sm text-brand-600 hover:underline">
          ← Back to application
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Photo Etiquette Training</h1>
        <p className="mt-1 text-neutral-500">
          Read each section carefully. You must acknowledge completion before continuing.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Image src={section.icon} alt="" width={20} height={20} className="object-contain" />
              </div>
              <h2 className="font-semibold text-neutral-900">{section.title}</h2>
            </div>
            {'body' in section && section.body && (
              <p className="text-sm text-neutral-600">{section.body}</p>
            )}
            {'items' in section && section.items && (
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <p className="mb-4 text-sm font-medium text-brand-900">
          By checking the box below, you confirm you have read and understood all photo etiquette
          rules and agree to follow them on every job.
        </p>
        <form action={completePhotoTraining}>
          <input type="hidden" name="photo_training_completed" value="true" />
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-brand-600"
            />
            <span className="text-sm text-brand-800">
              I have read and understood PureTask&apos;s photo etiquette guidelines and will follow
              them on every job.
            </span>
          </label>
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Complete Training &amp; Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhotoTrainingPage;
