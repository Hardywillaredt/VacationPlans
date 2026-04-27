const repoOwner = 'Hardywillaredt';
const repoName = 'VacationPlans';
const repoBase = `https://github.com/${repoOwner}/${repoName}`;

function buildIssueUrl(template, title) {
  const params = new URLSearchParams({ template, title });
  return `${repoBase}/issues/new?${params.toString()}`;
}

function buildIssuesQuery(labels = ['feedback']) {
  const query = `is:issue repo:${repoOwner}/${repoName} ${labels.map((label) => `label:${label}`).join(' ')}`;
  return `${repoBase}/issues?q=${encodeURIComponent(query)}`;
}

function makeChip(label, href, extraClass = 'chip') {
  const anchor = document.createElement('a');
  anchor.className = extraClass;
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  anchor.textContent = label;
  return anchor;
}

function getDayOptions() {
  return [...document.querySelectorAll('article.day')].map((dayCard) => {
    const date = dayCard.querySelector('.date')?.textContent?.trim() || 'Unknown date';
    const title = dayCard.querySelector('h3')?.textContent?.trim() || 'Unnamed day';
    return `${date} - ${title}`;
  });
}

function getLodgingOptions() {
  return [...document.querySelectorAll('#bookings tbody tr')].map((row) => {
    const area = row.querySelector('td[data-label="Area"]')?.textContent?.trim() || 'Unknown area';
    const property = row.querySelector('td[data-label="Property"] strong')?.textContent?.trim() || 'Unknown property';
    return `${property} - ${area}`;
  });
}

function fillSelect(select, options, placeholder) {
  select.innerHTML = '';
  if (options.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.appendChild(option);
    return;
  }
  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function setupFeedbackDialog() {
  const dialog = document.getElementById('feedback-dialog');
  const openButton = document.getElementById('open-feedback-dialog');
  const cancelButton = document.getElementById('feedback-cancel');
  const typeSelect = document.getElementById('feedback-type');
  const subjectSelect = document.getElementById('feedback-subject');
  const subjectLabel = document.getElementById('feedback-subject-label');
  const form = document.getElementById('feedback-form');

  if (!dialog || !openButton || !cancelButton || !typeSelect || !subjectSelect || !subjectLabel || !form) {
    return;
  }

  const dayOptions = getDayOptions();
  const lodgingOptions = getLodgingOptions();

  function syncSubjectField() {
    const type = typeSelect.value;
    if (type === 'general') {
      subjectLabel.style.display = 'none';
      fillSelect(subjectSelect, [], 'No target needed');
      return;
    }

    subjectLabel.style.display = '';
    if (type === 'day') {
      fillSelect(subjectSelect, dayOptions, 'No day targets found');
      return;
    }

    fillSelect(subjectSelect, lodgingOptions, 'No lodging targets found');
  }

  openButton.addEventListener('click', () => {
    syncSubjectField();
    dialog.showModal();
  });

  cancelButton.addEventListener('click', () => dialog.close());
  typeSelect.addEventListener('change', syncSubjectField);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const type = typeSelect.value;
    let template = 'general-comment.yml';
    let title = '[General] Trip feedback';

    if (type === 'day') {
      template = 'day-feedback.yml';
      title = `[Day] ${subjectSelect.value}`;
    } else if (type === 'lodging') {
      template = 'lodging-update.yml';
      title = `[Lodging] ${subjectSelect.value}`;
    }

    window.open(buildIssueUrl(template, title), '_blank', 'noopener');
    dialog.close();
  });

  syncSubjectField();
}

function addFeedbackFilters() {
  const host = document.getElementById('feedback-filters');
  if (!host) return;

  const buttons = [
    { label: 'All', value: 'all' },
    { label: 'Day', value: 'day-feedback' },
    { label: 'Lodging', value: 'lodging-update' },
    { label: 'General', value: 'general-comment' },
  ];

  buttons.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = index === 0 ? 'chip' : 'chip';
    button.dataset.filter = item.value;
    button.textContent = item.label;
    host.appendChild(button);
  });
}

function renderFeedbackSummary(data) {
  const host = document.getElementById('feedback-summary');
  if (!host) return;

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    host.textContent = 'No synced feedback yet.';
    return;
  }

  host.innerHTML = '';

  const items = data.items;
  const counts = {
    all: items.length,
    'day-feedback': items.filter((item) => item.labels.includes('day-feedback')).length,
    'lodging-update': items.filter((item) => item.labels.includes('lodging-update')).length,
    'general-comment': items.filter((item) => item.labels.includes('general-comment')).length,
  };

  document.querySelectorAll('#feedback-filters [data-filter]').forEach((button) => {
    const filter = button.dataset.filter;
    const count = filter === 'all' ? counts.all : counts[filter];
    button.textContent = `${button.textContent.split(' (')[0]} (${count})`;
  });

  const summary = document.createElement('p');
  summary.className = 'tiny muted';
  summary.textContent = `Synced ${items.length} feedback items. Last sync: ${data.generatedAt || 'unknown'}.`;
  host.appendChild(summary);

  const listHost = document.createElement('div');
  listHost.id = 'feedback-items';
  host.appendChild(listHost);

  function renderItems(filter = 'all') {
    listHost.innerHTML = '';
    const visibleItems = filter === 'all'
      ? items
      : items.filter((item) => item.labels.includes(filter));

    if (visibleItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tiny muted';
      empty.textContent = 'No feedback items match this filter yet.';
      listHost.appendChild(empty);
      return;
    }

    visibleItems.slice(0, 12).forEach((item) => {
      const card = document.createElement('div');
      card.className = 'feedback-item';
      const title = document.createElement('a');
      title.href = item.html_url;
      title.target = '_blank';
      title.rel = 'noreferrer';
      title.textContent = item.title;
      card.appendChild(title);

      const meta = document.createElement('p');
      meta.className = 'tiny muted';
      meta.textContent = `State: ${item.state}. Labels: ${item.labels.join(', ')}. Votes: +${item.reactions.plus_one} / -${item.reactions.minus_one}.`;
      card.appendChild(meta);

      if (item.excerpt) {
        const excerpt = document.createElement('p');
        excerpt.textContent = item.excerpt;
        card.appendChild(excerpt);
      }

      listHost.appendChild(card);
    });
  }

  renderItems('all');

  document.querySelectorAll('#feedback-filters [data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      renderItems(button.dataset.filter);
    });
  });
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
  addFeedbackFilters();
  setupFeedbackDialog();
  loadFeedbackSummary();
});
