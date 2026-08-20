<script lang="ts">
  import type { PageData } from './$types';
  import WageDistributionChart from '$lib/components/WageDistributionChart.svelte';
  import { onMount } from 'svelte';

  export let data: PageData;
  const {
    occupations,
    occupationTechnologies,
    technologies,
    stateWages,
    courses,
    courseJobRatings
  } = data;

  // ── State ──────────────────────────────────────────
  type Tab = 'discover' | 'career' | 'skill' | 'salary' | 'plan';
  let activeTab: Tab = 'discover';

  // ── Theme (light/dark) ──────────────────
  let theme: 'light' | 'dark' = 'light';
  onMount(() => {
    const cur = document.documentElement.getAttribute('data-theme');
    theme = cur === 'dark' ? 'dark' : 'light';
  });
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('mc-theme', theme); } catch (e) { /* private mode */ }
  }

  // ── Data provenance (shown in footer; keep in sync with the CSVs) ──
  const WAGE_SOURCE = 'BLS OEWS';
  const WAGE_VINTAGE = 'May 2025';

  // ── Course-suggestion grouping (curriculum path) ─────────
  const TIER_GROUPS = [
    { label: 'Foundational Core',       tiers: ['intro_core'] },
    { label: 'Track Requirements',      tiers: ['track_required'] },
    { label: 'Advanced Core',           tiers: ['advanced_core'] },
    { label: 'Recommended Electives',   tiers: ['intermediate_core', 'track_elective', 'elective'] }
  ];
  function groupCourses(list: any[]) {
    return TIER_GROUPS
      .map(g => ({ label: g.label, items: list.filter((c: any) => g.tiers.includes(c.tier)) }))
      .filter(g => g.items.length);
  }
  $: groupedCourses = groupCourses(recommendedCourses);

  // Discovery survey — branching tree
  let surveyPath: { key: string; question: string; options: { label: string; value: string }[] }[] = [];
  let surveyAnswers: Record<string, string> = {};
  let surveyStep = 0;

  // All possible questions
  const Q: Record<string, { question: string; options: { label: string; value: string }[] }> = {
    // Q1: Universal entry
    style: {
      question: 'What kind of work excites you most?',
      options: [
        { label: 'Writing stories, articles, or scripts', value: 'writing' },
        { label: 'Creating videos, audio, or visual content', value: 'production' },
        { label: 'Planning campaigns, brands, and strategies', value: 'strategy' },
        { label: 'I\'m not sure yet — help me explore', value: 'unsure' }
      ]
    },
    // Branch: Writing
    writing_type: {
      question: 'What kind of writing interests you?',
      options: [
        { label: 'News reporting and journalism', value: 'news' },
        { label: 'Feature stories and long-form writing', value: 'features' },
        { label: 'Corporate communications and PR', value: 'corporate' },
        { label: 'Digital content and social media', value: 'digital' }
      ]
    },
    writing_depth: {
      question: 'What appeals to you more?',
      options: [
        { label: 'Breaking news and tight deadlines', value: 'breaking' },
        { label: 'Investigative work and deep research', value: 'investigative' },
        { label: 'Human interest and community stories', value: 'human' },
        { label: 'Sports coverage and commentary', value: 'sports' }
      ]
    },
    // Branch: Production
    production_type: {
      question: 'What medium draws you in?',
      options: [
        { label: 'Video — shooting and editing', value: 'video' },
        { label: 'Audio — podcasts, radio, sound design', value: 'audio' },
        { label: 'Photography and visual storytelling', value: 'photo' },
        { label: 'A mix — I want to do it all', value: 'mixed' }
      ]
    },
    production_context: {
      question: 'What kind of content do you want to create?',
      options: [
        { label: 'Narrative films and documentaries', value: 'narrative' },
        { label: 'News packages and live production', value: 'news_prod' },
        { label: 'Commercials and corporate video', value: 'commercial' },
        { label: 'Music, podcasts, and audio storytelling', value: 'audio_story' }
      ]
    },
    // Branch: Strategy
    strategy_context: {
      question: 'What kind of organization do you want to work for?',
      options: [
        { label: 'An advertising or creative agency', value: 'agency' },
        { label: 'A corporate marketing department', value: 'corporate_mkt' },
        { label: 'A nonprofit, government, or advocacy group', value: 'nonprofit' },
        { label: 'My own business or freelance practice', value: 'entrepreneur' }
      ]
    },
    strategy_focus: {
      question: 'Which part of strategy appeals to you?',
      options: [
        { label: 'Creative — designing ads, writing copy', value: 'creative' },
        { label: 'Analytical — research, data, media planning', value: 'analytical' },
        { label: 'Relationship — client management, PR, events', value: 'relationships' },
        { label: 'Digital — social media, web, SEO', value: 'digital_mkt' }
      ]
    },
    // Branch: Unsure
    unsure_preference: {
      question: 'Which sounds more like you?',
      options: [
        { label: 'I like telling stories about people and events', value: 'storyteller' },
        { label: 'I like making things look and sound great', value: 'maker' },
        { label: 'I like persuading people and solving problems', value: 'persuader' },
        { label: 'I like understanding how things work and analyzing information', value: 'analyzer' }
      ]
    },
    unsure_pace: {
      question: 'What pace do you prefer?',
      options: [
        { label: 'Fast — deadlines, breaking news, quick turnaround', value: 'fast' },
        { label: 'Steady — planned projects with clear timelines', value: 'steady' },
        { label: 'Creative — flexible, iterative, exploratory', value: 'creative_pace' }
      ]
    },
    // Universal closing questions (everyone gets these)
    data_comfort: {
      question: 'How do you feel about working with data and numbers?',
      options: [
        { label: 'I enjoy it — analytics, stats, research', value: 'love' },
        { label: 'It\'s fine when I need to use it', value: 'okay' },
        { label: 'I\'d rather focus on creative work', value: 'avoid' }
      ]
    },
    work_setting: {
      question: 'Where do you see yourself?',
      options: [
        { label: 'Newsroom or media outlet', value: 'newsroom' },
        { label: 'Agency or consulting firm', value: 'agency_set' },
        { label: 'Production studio or on location', value: 'studio_set' },
        { label: 'Corporate office or remote', value: 'corporate_set' },
        { label: 'Freelance or self-employed', value: 'freelance_set' }
      ]
    },
    teamwork: {
      question: 'How do you prefer to work?',
      options: [
        { label: 'On a team — collaboration energizes me', value: 'team' },
        { label: 'Independently — I do my best work solo', value: 'solo' },
        { label: 'Leading others — I like being in charge', value: 'leader' }
      ]
    }
  };

  // Build the question path based on previous answers
  function buildSurveyPath(): typeof surveyPath {
    const path = [Q.style];
    const style = surveyAnswers.style;

    if (style === 'writing') {
      path.push(Q.writing_type);
      path.push(Q.writing_depth);
    } else if (style === 'production') {
      path.push(Q.production_type);
      path.push(Q.production_context);
    } else if (style === 'strategy') {
      path.push(Q.strategy_context);
      path.push(Q.strategy_focus);
    } else if (style === 'unsure') {
      path.push(Q.unsure_preference);
      path.push(Q.unsure_pace);
    }

    // Universal closing (everyone gets these)
    path.push(Q.data_comfort);
    path.push(Q.work_setting);
    path.push(Q.teamwork);

    return path.map((q, i) => {
      const keys = Object.entries(Q).find(([_, v]) => v === q);
      return { key: keys ? keys[0] : `q${i}`, ...q };
    });
  }

  $: surveyPath = buildSurveyPath();
  $: currentQuestion = surveyPath[surveyStep];
  $: surveyTotalSteps = surveyPath.length;

  function answerSurvey(key: string, value: string) {
    surveyAnswers = { ...surveyAnswers, [key]: value };
    // If this was Q1, rebuild the path (branching happens here)
    if (key === 'style') {
      surveyPath = buildSurveyPath();
    }
    if (surveyStep < surveyPath.length - 1) {
      surveyStep++;
    }
  }

  function resetSurvey() {
    surveyStep = 0;
    surveyAnswers = {};
    surveyPath = buildSurveyPath();
  }

  $: surveyComplete = surveyStep === surveyPath.length - 1 && Object.keys(surveyAnswers).length >= surveyPath.length;

  // Score careers based on survey answers — weighted by specificity
  $: surveyResults = (() => {
    if (!surveyComplete) return [];

    const scores = new Map<string, { score: number; track: string }>();
    const seen = new Set<string>();

    occupations.forEach((o: any) => {
      const base = getBaseTitle(o['Title - Alt']);
      if (seen.has(base)) return;
      seen.add(base);

      let score = 0;
      const track = o.Track.toLowerCase();
      const title = base.toLowerCase();

      // ── Style (weight: 3) ──
      if (surveyAnswers.style === 'writing' && track.includes('journalism')) score += 3;
      if (surveyAnswers.style === 'production' && track.includes('production')) score += 3;
      if (surveyAnswers.style === 'strategy' && track.includes('strategic')) score += 3;
      if (surveyAnswers.style === 'unsure') score += 1;

      // ── Branch-specific scoring (weight: 2) ──
      // Writing branch
      if (surveyAnswers.writing_type === 'news' && (title.includes('reporter') || title.includes('journalist') || title.includes('editor'))) score += 2;
      if (surveyAnswers.writing_type === 'features' && (title.includes('editor') || title.includes('writer'))) score += 2;
      if (surveyAnswers.writing_type === 'corporate' && (title.includes('public relations') || title.includes('communications'))) score += 2;
      if (surveyAnswers.writing_type === 'digital' && (title.includes('search') || title.includes('marketing') || title.includes('editor'))) score += 2;

      if (surveyAnswers.writing_depth === 'breaking' && title.includes('reporter')) score += 2;
      if (surveyAnswers.writing_depth === 'investigative' && (title.includes('reporter') || title.includes('editor'))) score += 2;
      if (surveyAnswers.writing_depth === 'sports' && title.includes('reporter')) score += 1;

      // Production branch
      if (surveyAnswers.production_type === 'video' && (title.includes('camera') || title.includes('film') || title.includes('video') || title.includes('producer') || title.includes('director'))) score += 2;
      if (surveyAnswers.production_type === 'audio' && (title.includes('audio') || title.includes('sound') || title.includes('music'))) score += 2;
      if (surveyAnswers.production_type === 'photo' && title.includes('camera')) score += 2;

      if (surveyAnswers.production_context === 'narrative' && (title.includes('film') || title.includes('director') || title.includes('producer'))) score += 2;
      if (surveyAnswers.production_context === 'news_prod' && (title.includes('technical director') || title.includes('programming'))) score += 2;
      if (surveyAnswers.production_context === 'commercial' && (title.includes('advertising') || title.includes('producer'))) score += 2;
      if (surveyAnswers.production_context === 'audio_story' && (title.includes('audio') || title.includes('sound') || title.includes('music'))) score += 2;

      // Strategy branch
      if (surveyAnswers.strategy_context === 'agency' && (title.includes('advertising') || title.includes('art director'))) score += 2;
      if (surveyAnswers.strategy_context === 'corporate_mkt' && (title.includes('marketing') || title.includes('public relations'))) score += 2;
      if (surveyAnswers.strategy_context === 'nonprofit' && (title.includes('fundrais') || title.includes('public relations'))) score += 2;
      if (surveyAnswers.strategy_context === 'entrepreneur' && (title.includes('advertising') || title.includes('marketing'))) score += 1;

      if (surveyAnswers.strategy_focus === 'creative' && (title.includes('art director') || title.includes('advertising'))) score += 2;
      if (surveyAnswers.strategy_focus === 'analytical' && (title.includes('market research') || title.includes('search marketing'))) score += 2;
      if (surveyAnswers.strategy_focus === 'relationships' && (title.includes('public relations') || title.includes('fundrais'))) score += 2;
      if (surveyAnswers.strategy_focus === 'digital_mkt' && (title.includes('search marketing') || title.includes('marketing'))) score += 2;

      // Unsure branch
      if (surveyAnswers.unsure_preference === 'storyteller' && track.includes('journalism')) score += 2;
      if (surveyAnswers.unsure_preference === 'maker' && track.includes('production')) score += 2;
      if (surveyAnswers.unsure_preference === 'persuader' && track.includes('strategic')) score += 2;
      if (surveyAnswers.unsure_preference === 'analyzer' && (title.includes('research') || title.includes('search marketing'))) score += 2;

      if (surveyAnswers.unsure_pace === 'fast' && (title.includes('reporter') || title.includes('news'))) score += 1;
      if (surveyAnswers.unsure_pace === 'creative_pace' && track.includes('production')) score += 1;

      // ── Universal closing questions (weight: 1) ──
      if (surveyAnswers.data_comfort === 'love' && (title.includes('research') || title.includes('search marketing'))) score += 2;
      if (surveyAnswers.data_comfort === 'love' && track.includes('strategic')) score += 1;
      if (surveyAnswers.data_comfort === 'avoid' && track.includes('production')) score += 1;

      if (surveyAnswers.work_setting === 'newsroom' && track.includes('journalism')) score += 1;
      if (surveyAnswers.work_setting === 'agency_set' && track.includes('strategic')) score += 1;
      if (surveyAnswers.work_setting === 'studio_set' && track.includes('production')) score += 1;
      if (surveyAnswers.work_setting === 'freelance_set' && track.includes('production')) score += 1;

      if (surveyAnswers.teamwork === 'leader' && title.includes('manager')) score += 1;
      if (surveyAnswers.teamwork === 'solo' && (title.includes('editor') || title.includes('writer'))) score += 1;

      // Work environment
      if (surveyAnswers.environment === 'newsroom' && track.includes('journalism')) score += 2;
      if (surveyAnswers.environment === 'agency' && track.includes('strategic')) score += 2;
      if (surveyAnswers.environment === 'studio' && track.includes('production')) score += 2;
      if (surveyAnswers.environment === 'corporate' && track.includes('strategic')) score += 1;
      if (surveyAnswers.environment === 'freelance' && track.includes('production')) score += 1;

      if (score > 0) scores.set(base, { score, track: o.Track });
    });

    return Array.from(scores.entries())
      .map(([title, data]) => ({ title, ...data }))
      .filter((r: any) => isPlannable(r.title))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  })();

  // Career explorer
  let selectedTrack = '';
  let selectedBaseTitle = '';
  let selectedTitleAlt = '';
  let filteredOccupation: any = null;
  let careerVariants: any[] = [];
  let techTools: any[] = [];
  let filteredWages: any[] = [];
  let recommendedCourses: any[] = [];

  // Skill explorer
  let skillSearch = '';

  // Salary explorer
  let salaryMin = 40000;

  // My Plan
  let planCourses: any[] = [];
  // planCareer reserved for future use

  // ── Derived data ───────────────────────────────────
  const trackOptions = Array.from(new Set(occupations.map((o: any) => o.Track))).sort();

  // Map base occupation titles (without the variant) to OCC_CODEs for rating lookup
  const baseOccTitles = Array.from(new Set(courseJobRatings.length > 0
    ? Object.keys(courseJobRatings[0]).filter(k => k !== 'Course' && k !== 'Description')
    : []
  ));

  // Base titles that actually yield a course plan (>=1 course scoring >10).
  // Every tab filters through this so a non-plannable occupation is never offered.
  const plannableBaseTitles = new Set(
    baseOccTitles
      .filter((col: string) => courseJobRatings.some((row: any) => (parseFloat(row[col]) || 0) > 10))
      .map((col: string) => col.toLowerCase().trim())
  );
  const isPlannable = (baseTitle: string) => plannableBaseTitles.has(baseTitle.toLowerCase().trim());

  // Unique technologies for skill search
  const allTechTools = technologies.map((t: any) => ({
    id: Number(t.Tech_ID),
    name: t['Commodity Title'],
    examples: t.Examples
  }));

  // Course lookup
  const courseMap: Map<string, any> = new Map(courses.map((c: any) => [c.Course_ID, c]));

  // Unique base occupation titles from occupations.csv (for career dropdown)
  function getBaseTitle(titleAlt: string): string {
    const dash = titleAlt.indexOf(' - ');
    return dash > -1 ? titleAlt.substring(0, dash) : titleAlt;
  }

  // ── Career Explorer ────────────────────────────────

  // Build grouped career structure: base title → { occCode, track, variants[] }
  type CareerGroup = { baseTitle: string; occCode: string; track: string; variants: any[] };
  const careerGroups: CareerGroup[] = (() => {
    const groups = new Map<string, CareerGroup>();
    occupations.forEach((o: any) => {
      const base = getBaseTitle(o['Title - Alt']);
      if (!groups.has(base)) {
        groups.set(base, { baseTitle: base, occCode: o.OCC_CODE, track: o.Track, variants: [] });
      }
      groups.get(base)!.variants.push(o);
    });
    return Array.from(groups.values());
  })();

  $: baseTitleOptions = selectedTrack
    ? careerGroups.filter(g => g.track === selectedTrack).map(g => g.baseTitle).sort()
    : [];

  function onTrackChange() {
    selectedBaseTitle = '';
    selectedTitleAlt = '';
    filteredOccupation = null;
    careerVariants = [];
    techTools = [];
    filteredWages = [];
    recommendedCourses = [];
  }

  function onBaseTitleChange() {
    if (!selectedBaseTitle) return;
    const group = careerGroups.find(g => g.baseTitle === selectedBaseTitle && g.track === selectedTrack);
    if (!group) return;

    careerVariants = group.variants;
    // Auto-select first variant for display
    selectedTitleAlt = group.variants[0]?.['Title - Alt'] || '';
    loadCareerDetails(group);
  }

  function onVariantClick(variant: any) {
    selectedTitleAlt = variant['Title - Alt'];
    filteredOccupation = variant;
  }

  function loadCareerDetails(group: CareerGroup) {
    const firstVariant = group.variants[0];
    if (!firstVariant) return;

    filteredOccupation = firstVariant;

    // Tech tools — aggregate across all variants of this base career
    const allLinkedIDs = new Set<number>();
    group.variants.forEach((v: any) => {
      occupationTechnologies
        .filter((j: any) => j['Title - Alt'] === v['Title - Alt'])
        .forEach((j: any) => allLinkedIDs.add(Number(j.Tech_ID)));
    });
    techTools = technologies.filter((t: any) => allLinkedIDs.has(Number(t.Tech_ID)));

    // Wages — same OCC_CODE for all variants
    filteredWages = stateWages.filter((w: any) => w.OCC_CODE === group.occCode);

    // Course recommendations — match base title to rating matrix columns
    const matchingColumn = baseOccTitles.find(col =>
      col.toLowerCase().trim() === group.baseTitle.toLowerCase().trim()
    );

    if (matchingColumn && courseJobRatings.length > 0) {
      recommendedCourses = courseJobRatings
        .map((row: any) => ({
          courseKey: row.Course,
          description: row.Description,
          score: parseFloat(row[matchingColumn]) || 0
        }))
        .filter((c: any) => c.score > 10)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 12)
        .map((c: any) => {
          const courseId = c.courseKey.split(' - ')[0].replace(/\s/g, '');
          const currData = courseMap.get(courseId);
          return {
            ...c,
            courseId,
            tier: currData?.Tier || 'elective',
            requiredFor: currData?.Required_For || '',
            courseName: currData?.Course_Name || c.courseKey.split(' - ').slice(1).join(' - ') || c.courseKey
          };
        });
    } else {
      recommendedCourses = [];
    }
  }

  // ── Skill Explorer ─────────────────────────────────
  $: filteredSkills = skillSearch.length >= 2
    ? allTechTools.filter((t: any) =>
        t.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
        t.examples.toLowerCase().includes(skillSearch.toLowerCase())
      )
    : [];

  function getCareersForSkill(techId: number): any[] {
    const matchingTitleAlts = occupationTechnologies
      .filter((ot: any) => Number(ot.Tech_ID) === techId)
      .map((ot: any) => ot['Title - Alt']);
    const uniqueTitles = Array.from(new Set(matchingTitleAlts))
      .filter((title: any) => isPlannable(getBaseTitle(title)));
    return uniqueTitles.slice(0, 8).map(title => {
      const occ = occupations.find((o: any) => o['Title - Alt'] === title);
      return { title, track: occ?.Track || '' };
    });
  }

  let expandedSkill: number | null = null;

  // ── Salary Explorer ────────────────────────────────
  $: salaryFilteredCareers = (() => {
    const occCodeWages = new Map<string, number>();
    stateWages.forEach((w: any) => {
      if (w.AREA_TITLE === 'Illinois') {
        const wage = parseFloat(String(w.A_MEDIAN).replace(/,/g, ''));
        if (!isNaN(wage)) occCodeWages.set(w.OCC_CODE, wage);
      }
    });

    const seen = new Set<string>();
    return occupations
      .filter((o: any) => {
        const wage = occCodeWages.get(o.OCC_CODE);
        const base = getBaseTitle(o['Title - Alt']);
        if (seen.has(base)) return false;
        if (!wage || wage < salaryMin) return false;
        if (!isPlannable(base)) return false;
        seen.add(base);
        return true;
      })
      .map((o: any) => ({
        title: getBaseTitle(o['Title - Alt']),
        track: o.Track,
        wage: occCodeWages.get(o.OCC_CODE) || 0
      }))
      .sort((a: any, b: any) => b.wage - a.wage);
  })();

  // ── My Plan ────────────────────────────────────────
  function addToPlan(courseKey: string, courseName: string, tier: string) {
    if (!planCourses.find(c => c.courseKey === courseKey)) {
      planCourses = [...planCourses, { courseKey, courseName, tier }];
    }
  }

  function removeFromPlan(courseKey: string) {
    planCourses = planCourses.filter(c => c.courseKey !== courseKey);
  }

  function printPlan() {
    window.print();
  }

  function selectCareerFromBrowse(title: string, track: string) {
    selectedTrack = track;
    const base = getBaseTitle(title);
    selectedBaseTitle = base;
    onBaseTitleChange();
    // If a specific variant was clicked, select it
    if (title !== base) {
      const variant = careerVariants.find((v: any) => v['Title - Alt'] === title);
      if (variant) onVariantClick(variant);
    }
    activeTab = 'career';
  }

  // ── Helpers ────────────────────────────────────────
  function scoreColor(score: number): string {
    if (score >= 70) return 'var(--production)';
    if (score >= 40) return '#ff9800';
    return 'var(--grey-50)';
  }

  function trackBadgeClass(track: string): string {
    if (track.toLowerCase().includes('journalism')) return 'badge-journalism';
    if (track.toLowerCase().includes('production')) return 'badge-production';
    return 'badge-strategic';
  }

  function tierLabel(tier: string): string {
    switch(tier) {
      case 'intro_core': return 'Intro Core';
      case 'intermediate_core': return 'Intermediate';
      case 'advanced_core': return 'Advanced Core';
      case 'track_required': return 'Track Required';
      case 'track_elective': return 'Track Elective';
      default: return 'Elective';
    }
  }

  function tierBadgeClass(tier: string): string {
    if (tier.includes('intro')) return 'tier-intro';
    if (tier.includes('intermediate')) return 'tier-intermediate';
    if (tier.includes('advanced')) return 'tier-advanced';
    return 'tier-track';
  }

  function formatWage(n: number): string {
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  // Skill gap analysis removed from student-facing UI.
  // Internal gap report generated separately — see skills-gap-report.md
</script>

<div class="app">
  <div class="app-header">
    <h1>Career Pathfinder</h1>
    <button class="theme-toggle" type="button" on:click={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      <span class="icon" aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  </div>
  <p style="color: var(--grey-50); margin-bottom: 20px; font-size: 0.9rem;">
    Explore careers, discover which courses prepare you, and build your plan.
  </p>

  <!-- TABS -->
  <div class="tabs" role="tablist">
    <button class="tab" class:active={activeTab === 'discover'} on:click={() => activeTab = 'discover'} role="tab">
      Discover
    </button>
    <button class="tab" class:active={activeTab === 'career'} on:click={() => activeTab = 'career'} role="tab">
      Explore
    </button>
    <button class="tab" class:active={activeTab === 'skill'} on:click={() => activeTab = 'skill'} role="tab">
      By Skill
    </button>
    <button class="tab" class:active={activeTab === 'salary'} on:click={() => activeTab = 'salary'} role="tab">
      By Salary
    </button>
    <button class="tab" class:active={activeTab === 'plan'} on:click={() => activeTab = 'plan'} role="tab">
      Plan {#if planCourses.length}<span style="background:var(--accent);color:#fff;border-radius:50%;padding:0 6px;font-size:0.7rem;margin-left:4px;">{planCourses.length}</span>{/if}
    </button>
  </div>

  <!-- ════════════════════════════════════════════════ -->
  <!-- TAB: DISCOVER (Survey)                          -->
  <!-- ════════════════════════════════════════════════ -->
  {#if activeTab === 'discover'}
    <div class="section">
      {#if !surveyComplete}
        <h2>Find Your Path</h2>
        <p style="font-size:0.9rem;color:var(--grey-50);margin-bottom:20px;">
          Answer a few quick questions and we'll suggest careers that match your interests.
        </p>

        <!-- Progress -->
        <div style="display:flex;gap:4px;margin-bottom:20px;">
          {#each surveyPath as _, i}
            <div style="flex:1;height:4px;border-radius:2px;background:{i <= surveyStep ? 'var(--accent)' : 'var(--grey-20)'};transition:background 0.3s;"></div>
          {/each}
        </div>

        <p style="font-size:0.75rem;color:var(--grey-50);text-align:right;margin:-12px 0 12px 0;">
          Question {surveyStep + 1} of {surveyPath.length}
        </p>

        <!-- Current question -->
        {@const q = surveyPath[surveyStep]}
        <div class="card">
          <h3 style="margin-bottom:16px;">{q.question}</h3>
          {#each q.options as opt}
            <button class="survey-option" class:selected={surveyAnswers[q.key] === opt.value}
              on:click={() => answerSurvey(q.key, opt.value)}>
              {opt.label}
            </button>
          {/each}
        </div>

        {#if surveyStep > 0}
          <button class="btn btn-secondary" style="margin-top:12px;" on:click={() => surveyStep--}>
            Back
          </button>
        {/if}

      {:else}
        <!-- Results -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2>Your Matches</h2>
          <button class="btn btn-secondary" on:click={resetSurvey}>Retake</button>
        </div>

        <p style="font-size:0.9rem;color:var(--grey-50);margin-bottom:16px;">
          Based on your answers, these careers are the best fit. Tap any to explore courses and details.
        </p>

        {#each surveyResults as result, i}
          <div class="career-match" on:click={() => selectCareerFromBrowse(
            occupations.find((o) => getBaseTitle(o['Title - Alt']) === result.title)?.['Title - Alt'] || result.title,
            result.track
          )}>
            <div>
              <span style="font-family:var(--title-font);font-weight:700;color:var(--accent);margin-right:8px;">#{i + 1}</span>
              <span style="font-size:0.9rem;font-weight:600;">{result.title}</span>
              <span class="badge {trackBadgeClass(result.track)}" style="margin-left:8px;">{result.track}</span>
            </div>
            <span style="font-size:0.8rem;color:var(--grey-50);">Score: {result.score}</span>
          </div>
        {/each}
      {/if}
    </div>

  <!-- ════════════════════════════════════════════════ -->
  <!-- TAB: EXPLORE CAREERS                            -->
  <!-- ════════════════════════════════════════════════ -->
  {:else if activeTab === 'career'}
    <div class="section">
      <div class="field-group">
        <label for="track">Professional Track</label>
        <select id="track" bind:value={selectedTrack} on:change={onTrackChange}>
          <option disabled value="">Choose a track...</option>
          {#each trackOptions as t}
            <option value={t}>{t}</option>
          {/each}
        </select>
      </div>

      {#if baseTitleOptions.length}
        <div class="field-group">
          <label for="career">Career Area</label>
          <select id="career" bind:value={selectedBaseTitle} on:change={onBaseTitleChange}>
            <option disabled value="">Choose a career area...</option>
            {#each baseTitleOptions as t}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if filteredOccupation}
        <!-- Career details -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;flex-wrap:wrap;">
            <h2 style="margin:0;">{selectedBaseTitle}</h2>
            <span class="badge {trackBadgeClass(filteredOccupation.Track)}">{filteredOccupation.Track}</span>
          </div>
          <p style="margin-top:8px;font-size:0.9rem;color:var(--grey-70);">{filteredOccupation.Alt_Description}</p>

          <!-- Expandable variants -->
          {#if careerVariants.length > 1}
            <details style="margin-top:12px;">
              <summary style="cursor:pointer;font-size:0.85rem;font-weight:600;color:var(--accent);">
                {careerVariants.length} related job titles
              </summary>
              <div style="margin-top:8px;">
                {#each careerVariants as variant}
                  <div class="career-match" on:click={() => onVariantClick(variant)}
                    style="background:{selectedTitleAlt === variant['Title - Alt'] ? 'var(--grey-05)' : 'transparent'};">
                    <span style="font-size:0.85rem;">{variant['Title - Alt'].split(' - ')[1] || variant['Title - Alt']}</span>
                  </div>
                {/each}
              </div>
            </details>
          {/if}
        </div>

        <!-- Wage -->
        {#if filteredWages.length}
          {@const ilWage = filteredWages.find(w => w.AREA_TITLE === 'Illinois')}
          {#if ilWage}
            <div class="wage-stat">
              <div class="wage-number">{formatWage(parseFloat(String(ilWage.A_MEDIAN).replace(/,/g, '')))}</div>
              <div class="wage-label">Median Annual Salary in Illinois</div>
            </div>
          {/if}
          <div class="card">
            <h3>Salary Distribution by State</h3>
            <WageDistributionChart wageData={filteredWages} />
          </div>
        {/if}

        <!-- Recommended Courses -->
        {#if recommendedCourses.length}
          <div class="card">
            <h3>Recommended Courses</h3>
            <p style="font-size:0.8rem;color:var(--grey-50);margin-bottom:12px;">
              Courses ranked by relevance to this career. Tap + to add to your plan.
            </p>
            {#each groupedCourses as group}
              <div class="course-group-label" style="font-family:var(--title-font);font-size:0.72rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--grey-50);margin:14px 0 6px;">{group.label}</div>
              {#each group.items as course}
              <div class="course-item">
                <div class="course-score" style="background:{scoreColor(course.score)}">
                  {Math.round(course.score)}
                </div>
                <div class="course-info">
                  <h4>
                    {course.courseKey.split(' - ')[0]}
                    <span style="font-weight:400;color:var(--grey-70);">
                      {course.courseName}
                    </span>
                  </h4>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px;">
                    <span class="tier-badge {tierBadgeClass(course.tier)}">{tierLabel(course.tier)}</span>
                    {#if course.requiredFor === 'all'}
                      <span class="tier-badge tier-advanced">Required</span>
                    {/if}
                  </div>
                </div>
                <button class="plan-remove" title="Add to My Plan"
                  on:click={() => addToPlan(course.courseKey, course.courseName, course.tier)}
                  style="color:var(--production);font-size:1.4rem;">+</button>
              </div>
              {/each}
            {/each}
          </div>
        {/if}

        <!-- Tools & Technologies -->
        {#if techTools.length}
          <div class="card">
            <h3>Tools &amp; Technologies</h3>
            <p style="font-size:0.8rem;color:var(--grey-50);margin-bottom:8px;">
              Software and tools commonly used in this career.
            </p>
            <div class="tech-grid">
              {#each techTools as tool}
                <div class="tech-chip">
                  <div>
                    <strong>{tool['Commodity Title']}</strong>
                    <span style="display:block;">{tool.Examples}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

      {:else if selectedTrack}
        <div class="empty-state">
          <p>Select a career title to see details, recommended courses, and required skills.</p>
        </div>
      {:else}
        <div class="empty-state">
          <p>Start by choosing a professional track above.</p>
        </div>
      {/if}
    </div>

  <!-- ════════════════════════════════════════════════ -->
  <!-- TAB: FIND BY SKILL                              -->
  <!-- ════════════════════════════════════════════════ -->
  {:else if activeTab === 'skill'}
    <div class="section">
      <div class="field-group">
        <label for="skill-search">Search for a skill or tool</label>
        <input id="skill-search" type="text" bind:value={skillSearch}
          placeholder="e.g. Premiere Pro, Python, Salesforce..." />
      </div>

      {#if skillSearch.length < 2}
        <div class="empty-state">
          <p>Type a skill or tool name to find careers that need it.</p>
        </div>
      {:else if filteredSkills.length === 0}
        <div class="empty-state">
          <p>No matching skills found. Try a different term.</p>
        </div>
      {:else}
        {#each filteredSkills as skill}
          <div class="card card-clickable" on:click={() => expandedSkill = expandedSkill === skill.id ? null : skill.id}>
            <h3 style="margin:0;">{skill.name}</h3>
            <p style="font-size:0.8rem;color:var(--grey-50);margin:4px 0 0 0;">{skill.examples}</p>

            {#if expandedSkill === skill.id}
              <div style="margin-top:12px;border-top:1px solid var(--grey-10);padding-top:12px;">
                <h4 style="margin-bottom:8px;">Careers that use this skill:</h4>
                {#each getCareersForSkill(skill.id) as career}
                  <div class="career-match" on:click|stopPropagation={() => selectCareerFromBrowse(career.title, career.track)}>
                    <span style="font-size:0.9rem;">{career.title}</span>
                    <span class="badge {trackBadgeClass(career.track)}">{career.track}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

  <!-- ════════════════════════════════════════════════ -->
  <!-- TAB: BROWSE BY SALARY                           -->
  <!-- ════════════════════════════════════════════════ -->
  {:else if activeTab === 'salary'}
    <div class="section">
      <div class="field-group">
        <label for="salary-range">Minimum Annual Salary (Illinois)</label>
        <input id="salary-range" type="range" bind:value={salaryMin}
          min="25000" max="100000" step="5000"
          style="width:100%;accent-color:var(--accent);" />
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--grey-50);">
          <span>$25,000</span>
          <span style="font-weight:700;color:var(--accent);font-size:1rem;">{formatWage(salaryMin)}+</span>
          <span>$100,000</span>
        </div>
      </div>

      {#if salaryFilteredCareers.length === 0}
        <div class="empty-state">
          <p>No careers found at this salary level. Try lowering the minimum.</p>
        </div>
      {:else}
        <p style="font-size:0.8rem;color:var(--grey-50);margin-bottom:12px;">
          {salaryFilteredCareers.length} career{salaryFilteredCareers.length === 1 ? '' : 's'} with Illinois median salary at or above {formatWage(salaryMin)}
        </p>
        {#each salaryFilteredCareers as career}
          <div class="career-match" on:click={() => {
            // Find first variant of this base title
            const firstVariant = occupations.find((o) => getBaseTitle(o['Title - Alt']) === career.title);
            if (firstVariant) selectCareerFromBrowse(firstVariant['Title - Alt'], career.track);
          }}>
            <div>
              <span style="font-size:0.9rem;font-weight:600;">{career.title}</span>
              <span class="badge {trackBadgeClass(career.track)}" style="margin-left:8px;">{career.track}</span>
            </div>
            <span style="font-family:var(--title-font);font-weight:700;color:var(--accent);">
              {formatWage(career.wage)}
            </span>
          </div>
        {/each}
      {/if}
    </div>

  <!-- ════════════════════════════════════════════════ -->
  <!-- TAB: MY PLAN                                    -->
  <!-- ════════════════════════════════════════════════ -->
  {:else if activeTab === 'plan'}
    <div class="section">
      {#if planCourses.length === 0}
        <div class="empty-state">
          <p>Your plan is empty. Explore careers and tap + to add recommended courses.</p>
        </div>
      {:else}
        <div class="card">
          <h2>My Course Plan</h2>
          <p style="font-size:0.8rem;color:var(--grey-50);">
            {planCourses.length} course{planCourses.length === 1 ? '' : 's'} selected &middot;
            {planCourses.length * 3} credit hours
          </p>

          {#each planCourses as course}
            <div class="plan-item">
              <div>
                <strong style="font-size:0.9rem;">{course.courseKey.split(' - ')[0]}</strong>
                <span style="font-size:0.85rem;color:var(--grey-70);margin-left:4px;">{course.courseName}</span>
                <span class="tier-badge {tierBadgeClass(course.tier)}" style="margin-left:6px;">{tierLabel(course.tier)}</span>
              </div>
              <button class="plan-remove" on:click={() => removeFromPlan(course.courseKey)} title="Remove">&times;</button>
            </div>
          {/each}

          <div class="plan-actions">
            <button class="btn btn-primary" on:click={printPlan}>Print Plan</button>
            <button class="btn btn-secondary" on:click={() => planCourses = []}>Clear All</button>
          </div>
        </div>

        <div class="card" style="margin-top:12px;">
          <h3>What to Bring to Advising</h3>
          <ul style="font-size:0.85rem;color:var(--grey-70);padding-left:20px;">
            <li>This printed course plan</li>
            <li>Your <a href="https://degreeworks.siue.edu/Dashboard" target="_blank" rel="noopener">DegreeWorks audit</a></li>
            <li>Questions about your professional track</li>
          </ul>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Footer -->
  <footer style="text-align:center;padding:24px 0 12px;font-size:0.75rem;color:var(--grey-50);border-top:1px solid var(--grey-10);margin-top:24px;">
    SIUE Department of Mass Communications &middot;
    <a href="https://www.siue.edu/arts-and-sciences/mass-communications/" target="_blank" rel="noopener">Department Website</a> &middot;
    Wage data: {WAGE_SOURCE} {WAGE_VINTAGE} &middot; Occupations &amp; skills: O*NET &middot; Curriculum: Fall 2026
  </footer>
</div>
