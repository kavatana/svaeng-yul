-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — structural seed (subjects, topics, badges, posts, challenges)
-- Run after the migrations. Questions are loaded via the admin CSV importer
-- using public/sample-questions.csv (keeps this file small and portable).
-- ════════════════════════════════════════════════════════════════

-- ── subjects ──────────────────────────────────────────────────────
insert into public.subjects (name, slug, description, icon, color, order_index) values
  ('Demography', 'demography', 'Study how populations grow, move, and are measured.', 'Users', 'subject-demography', 0),
  ('Fundamental of Nursing Sciences', 'fundamental-of-nursing-sciences', 'Core skills and ethics of compassionate nursing care.', 'HeartPulse', 'subject-nursing', 1),
  ('History', 'history', 'Milestones that shaped medicine and Cambodian healthcare.', 'ScrollText', 'subject-history', 2),
  ('Infection Disease Agents', 'infection-disease-agents', 'The microbes that cause disease and how to stop them.', 'Bug', 'subject-infection', 3),
  ('Embryology', 'embryology', 'How a single cell becomes an organized human body.', 'Dna', 'subject-embryology', 4)
on conflict (slug) do nothing;

-- ── topics ────────────────────────────────────────────────────────
insert into public.topics (subject_id, name, slug, order_index)
select s.id, t.name, t.slug, t.ord
from public.subjects s
join (values
  ('demography','Population Concepts','population-concepts',0),
  ('demography','Birth Rate','birth-rate',1),
  ('demography','Mortality Rate','mortality-rate',2),
  ('demography','Fertility Rate','fertility-rate',3),
  ('demography','Public Health Indicators','public-health-indicators',4),
  ('fundamental-of-nursing-sciences','Vital Signs','vital-signs',0),
  ('fundamental-of-nursing-sciences','Patient Safety','patient-safety',1),
  ('fundamental-of-nursing-sciences','Basic Care','basic-care',2),
  ('fundamental-of-nursing-sciences','Infection Control Basics','infection-control-basics',3),
  ('fundamental-of-nursing-sciences','Nursing Ethics','nursing-ethics',4),
  ('history','Cambodian Medical Education History','cambodian-medical-education-history',0),
  ('history','Public Health History','public-health-history',1),
  ('history','Important Medical Milestones','important-medical-milestones',2),
  ('history','Healthcare System Development','healthcare-system-development',3),
  ('infection-disease-agents','Bacteria','bacteria',0),
  ('infection-disease-agents','Virus','virus',1),
  ('infection-disease-agents','Fungi','fungi',2),
  ('infection-disease-agents','Parasites','parasites',3),
  ('infection-disease-agents','Transmission','transmission',4),
  ('infection-disease-agents','Prevention','prevention',5),
  ('embryology','Fertilization','fertilization',0),
  ('embryology','Week 1 Development','week-1-development',1),
  ('embryology','Week 2 Development','week-2-development',2),
  ('embryology','Germ Layers','germ-layers',3),
  ('embryology','Placenta Basics','placenta-basics',4)
) as t(subject_slug, name, slug, ord) on t.subject_slug = s.slug
on conflict (subject_id, slug) do nothing;

-- ── badges ────────────────────────────────────────────────────────
insert into public.badges (key, name, description, icon, condition_type, condition_value) values
  ('first-qcm','First QCM','Completed your very first quiz.','Sparkles','first_quiz',1),
  ('streak-3','3-Day Streak','Studied three days in a row.','Flame','streak',3),
  ('streak-7','7-Day Streak','A full week of practice. Beautiful.','Flame','streak',7),
  ('infection-fighter','Infection Fighter','Completed 5 quizzes in Infection Disease Agents.','Bug','subject_quizzes',5),
  ('embryology-starter','Embryology Starter','Completed your first Embryology quiz.','Dna','subject_quizzes',1),
  ('nursing-core','Nursing Core','Completed 5 quizzes in Nursing Sciences.','HeartPulse','subject_quizzes',5),
  ('demography-builder','Demography Builder','Completed 5 quizzes in Demography.','Users','subject_quizzes',5),
  ('perfect-10','Perfect 10','Scored 100% on a quiz.','Star','perfect_score',100),
  ('comeback-student','Comeback Student','Returned to practice after a break.','Undo2','comeback',1),
  ('night-owl','Night Owl','Practiced late at night.','Moon','night_owl',1)
on conflict (key) do nothing;

-- ── posts ─────────────────────────────────────────────────────────
insert into public.posts (title, slug, content, subject_id, category, status, read_time_minutes) values
  ('How to study QCM calmly at night', 'study-qcm-calmly-at-night',
   E'Late-night study works best when it is gentle.\n\n1. Pick one topic, not five.\n2. Do 10 questions, not 100.\n3. Read the explanation for every question.\n4. Note one weak area and revisit it tomorrow.',
   null, 'Study Tips', 'published', 3),
  ('Bacteria vs viruses: a quick mental model', 'bacteria-vs-viruses-mental-model',
   E'Bacteria are living, single-celled prokaryotes — often treatable with antibiotics.\n\nViruses are not cells; they must hijack a host cell to replicate. Antibiotics do not work on them.',
   (select id from public.subjects where slug='infection-disease-agents'), 'Infection Disease Agents', 'published', 2),
  ('Exam-day checklist for med students', 'exam-day-checklist',
   E'Before the exam:\n\n- Sleep beats one more hour of cramming.\n- Read each QCM stem fully before the options.\n- Mark hard questions and return to them.\n- Breathe. You have practiced for this.',
   null, 'Exam Tips', 'published', 2)
on conflict (slug) do nothing;

-- ── challenges ────────────────────────────────────────────────────
insert into public.challenges (title, description, subject_id, target_type, target_value, xp_reward, badge_name, starts_at, ends_at) values
  ('Infection Fighter Week', 'Complete 50 QCM in Infection Disease Agents this week.',
   (select id from public.subjects where slug='infection-disease-agents'),
   'questions_answered', 50, 300, 'Infection Fighter', now(), now() + interval '365 days'),
  ('Daily 10', 'Answer 10 questions today to keep your streak alive.',
   null, 'questions_answered', 10, 100, null, now(), now() + interval '365 days');
