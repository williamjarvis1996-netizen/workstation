import { projectRisks } from './planning.mjs';
import { portfolioProjects, readLife, updateLife, today } from './life.mjs';
import { externalLink, make, safeUrl } from './storage.mjs';

const phaseGroups = [
  ['Pitch & development', /pitch|develop|concept/i],
  ['Pre-production', /pre.production/i],
  ['Production', /shoot|^production/i],
  ['Post & delivery', /post|delivery|finish/i],
];
const health = { 'on-track': 'var(--color-success)', 'at-risk': 'var(--color-warn)', blocked: 'var(--color-danger)' };
const projectId = code => 'project-' + encodeURIComponent(code);

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('portfolio');
  if (!root) return;
  const lifecycle = new AbortController();
  const snapshot = JSON.parse(root.dataset.projects);
  const demo = root.dataset.demo === 'true';
  const feedback = document.getElementById('portfolio-feedback');
  const riskList = document.getElementById('portfolio-risks');
  const board = document.getElementById('portfolio-board');
  let signature;

  function card(project, projects, open) {
    const tile = make('article', '', 'pcard');
    tile.id = projectId(project.code);
    tile.style.setProperty('--health-color', health[project.health] || health['on-track']);
    const top = make('div', '', 'pcard-top');
    top.append(make('span', project.code, 'pcard-code'), make('span', project.health.replace('-', ' '), 'pcard-health pcard-health--' + project.health));
    const milestone = make('div', '', 'production-next');
    milestone.append(make('span', 'Next milestone'), make('strong', project.milestone || project.nextMilestone || 'Milestone pending'));
    const details = [(project.milestoneDate || project.nextMilestoneDate) && 'Due ' + (project.milestoneDate || project.nextMilestoneDate),
      project.deadline && 'Delivery ' + project.deadline, project.owner && 'Owner: ' + project.owner, project.waitingOn && 'Waiting on: ' + project.waitingOn].filter(Boolean);
    if (details.length) milestone.append(make('small', details.join(' · ')));
    const editor = make('details', '', 'project-handover');
    editor.open = open;
    const form = make('form');
    for (const [name, label, type, value] of [
      ['milestone','Deliverable','text',project.milestone ?? project.nextMilestone],
      ['milestoneDate','Milestone due','date',project.milestoneDate ?? project.nextMilestoneDate],
      ['owner','Owner','text',project.owner],
      ['waitingOn','Waiting on','text',project.waitingOn],
    ]) {
      const field = make('label', label);
      const input = make('input'); input.type = type; input.name = name; input.value = value || ''; input.maxLength = 180;
      field.append(input); form.append(field);
    }
    const dependency = make('label', 'Depends on');
    const select = make('select');
    select.name = 'dependsOn'; select.multiple = true; select.size = 3;
    for (const candidate of projects.filter(item => item.code !== project.code)) {
      select.add(new Option(candidate.name, candidate.code, false, (project.dependsOn || []).includes(candidate.code)));
    }
    dependency.append(select);
    const button = make('button', 'Save handover', 'action-button'); button.type = 'submit';
    form.append(dependency, button);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(form);
      const plan = Object.fromEntries(['milestone','milestoneDate','owner','waitingOn'].map(key => [key, String(values.get(key) || '').trim()]));
      plan.dependsOn = values.getAll('dependsOn');
      try {
        if (form.contains(document.activeElement)) document.activeElement.blur();
        updateLife(data => { data.projectPlans[project.code] = plan; });
        feedback.textContent = 'Project handover saved.';
        document.getElementById(tile.id)?.querySelector('summary')?.focus();
      } catch { feedback.textContent = 'Could not save the project handover.'; }
    });
    editor.append(make('summary', 'Edit handover'), form);
    tile.append(top, make('h3', project.name, 'pcard-name'), make('div', [project.client, project.phase].filter(Boolean).join(' · '), 'pcard-client'),
      milestone, editor, make('p', project.statusSummary, 'pcard-status'));
    const links = make('div', '', 'pcard-links');
    for (const link of project.links || []) {
      const url = safeUrl(link.url);
      if (url) links.append(externalLink(link.label, url));
    }
    if (links.childElementCount) tile.append(links);
    return tile;
  }

  function render() {
    const projects = projectRisks(portfolioProjects(snapshot, demo), readLife().projectPlans, today());
    const active = projects.filter(project => project.status === 'active');
    const next = JSON.stringify(active);
    if (signature === next || board.querySelector('form') && document.activeElement.closest('form') && board.contains(document.activeElement)) return;
    signature = next;
    document.getElementById('portfolio-source').textContent = Object.keys(readLife().portfolio).length ? 'Imported snapshot' : demo ? 'Sample data' : '';
    const open = new Set([...board.querySelectorAll('details[open]')].map(details => details.closest('article').id));
    const flagged = active.filter(project => project.risk).sort((a, b) => Number(b.blocked) - Number(a.blocked));
    riskList.replaceChildren(...flagged.map(project => {
      const row = make('li');
      const link = make('a', project.name); link.href = '#' + projectId(project.code);
      row.append(link, make('small', project.reasons.join(' · ')));
      if (project.impacts.length) row.append(make('span', 'Can affect ' + project.impacts.join(', '), 'risk-impact'));
      return row;
    }));
    if (!flagged.length) riskList.append(make('li', 'No active projects are flagged.', 'empty-state-sm'));
    board.replaceChildren();
    for (const phase of [...phaseGroups.map(([label]) => label), 'Other']) {
      const members = active.filter(project => (phaseGroups.find(([, pattern]) => pattern.test(project.phase))?.[0] || 'Other') === phase)
        .sort((a,b) => (a.milestoneDate || a.nextMilestoneDate || a.deadline || '9999').localeCompare(b.milestoneDate || b.nextMilestoneDate || b.deadline || '9999'));
      if (!members.length) continue;
      const lane = make('section', '', 'production-lane');
      const heading = make('header'); heading.append(make('h2', phase), make('span', String(members.length), 'pill'));
      lane.append(heading, ...members.map(project => card(project, projects, open.has(projectId(project.code)))));
      board.append(lane);
    }
  }
  document.addEventListener('workstation:change', render, { signal: lifecycle.signal });
  document.addEventListener('astro:before-swap', () => lifecycle.abort(), { once: true });
  render();
});
