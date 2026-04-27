const repoOwner = 'Hardywillaredt';
const repoName = 'VacationPlans';
const repoBase = `https://github.com/${repoOwner}/${repoName}`;

function buildIssueUrl(template, title) {
  const params = new URLSearchParams({
    template,
    title,
  });
  return `${repoBase}/issues/new?${params.toString()}`;
}

function buildIssuesQuery(labels) {
  const query = `is:issue repo:${repoOwner}/${repoName} ${labels.map((label) => `label:${label}`).join(' ')}`;
  return `${repoBase}/issues?q=${encodeURIComponent(query)}`;
}

function makeChip(label, href) {
  const anchor = document.createElement('a');
  anchor.className = 'chip';
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  anchor.textContent = label;
  return anchor;
}

function addGeneralActions() {
  const host = document.getElementById('feedback-general-actions');
  if (!host) return;

  host.appendChild(makeChip('General Feedback', buildIssueUrl('general-comment.yml', 'General trip feedback')));
  host.appendChild(makeChip('View Feedback Issues', buildIssuesQuery(['feedback'])));
  host.appendChild(makeChip('Open Discussions', `${repoBase}/discussions`));
}

function addDayFeedbackLinks() {
  document.querySelectorAll('article.day').forEach((dayCard) => {
    const date = dayCard.querySelector('.date')?.textContent?.trim() || 'Unknown date';
    const title = dayCard.querySelector('h3')?.textContent?.trim() || 'Unnamed day';
    const row = document.createElement('div');
    row.className = 'feedback-row';
    row.appendChild(makeChip('Comment On This Day', buildIssueUrl('day-feedback.yml', `[Day] ${date} - ${title}`)));
    row.appendChild(makeChip('View Day Feedback', buildIssuesQuery(['feedback', 'day-feedback'])));
    dayCard.appendChild(row);
  });
}

function addLodgingFeedbackLinks() {
  document.querySelectorAll('#bookings tbody tr').forEach((row) => {
    const area = row.querySelector('td[data-label="Area"]')?.textContent?.trim() || 'Unknown area';
    const property = row.querySelector('td[data-label="Property"] strong')?.textContent?.trim() || 'Unknown property';
    const targetCell = row.querySelector('td[data-label="Link"]');
    if (!targetCell) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'feedback-row';
    wrapper.style.marginTop = '0.55rem';
    wrapper.appendChild(makeChip('Update This Lodging', buildIssueUrl('lodging-update.yml', `[Lodging] ${property} - ${area}`)));
    wrapper.appendChild(makeChip('View Lodging Feedback', buildIssuesQuery(['feedback', 'lodging-update'])));
    targetCell.appendChild(wrapper);
  });
}

function renderFeedbackSummary(data) {
  const host = document.getElementById('feedback-summary');
  if (!host) return;

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    host.textContent = 'No synced feedback yet.';
    return;
  }

  const counts = {
    day: 0,
    lodging: 0,
    general: 0,
  };

  data.items.forEach((item) => {
    if (item.labels.includes('day-feedback')) counts.day += 1;
    else if (item.labels.includes('lodging-update')) counts.lodging += 1;
    else if (item.labels.includes('general-comment')) counts.general += 1;
  });

  host.innerHTML = '';

  const summary = document.createElement('p');
  summary.className = 'tiny muted';
  summary.textContent = `Synced ${data.items.length} feedback items. Day: ${counts.day}. Lodging: ${counts.lodging}. General: ${counts.general}. Last sync: ${data.generatedAt || 'unknown'}.`;
  host.appendChild(summary);

  const list = document.createElement('ul');
  list.className = 'detail-list';
  data.items.slice(0, 8).forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.html_url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = item.title;
    li.appendChild(link);
    li.append(` (${item.state})`);
    if (item.excerpt) {
      li.append(` - ${item.excerpt}`);
    }
    list.appendChild(li);
  });
  host.appendChild(list);
}

async function loadFeedbackSummary() {
  try {
    const response = await fetch('data/feedback.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderFeedbackSummary(data);
  } catch (_) {
    const host = document.getElementById('feedback-summary');
    if (host) {
      host.textContent = 'Feedback data is not available yet.';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  addGeneralActions();
  addDayFeedbackLinks();
  addLodgingFeedbackLinks();
  loadFeedbackSummary();
});
