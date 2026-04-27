const repoOwner = 'Hardywillaredt';
const repoName = 'VacationPlans';
const repoBase = `https://github.com/${repoOwner}/${repoName}`;

function buildIssuesQuery(labels = ['feedback']) {
  const query = `is:issue repo:${repoOwner}/${repoName} ${labels.map((label) => `label:${label}`).join(' ')}`;
  return `${repoBase}/issues?q=${encodeURIComponent(query)}`;
}

function buildIssueUrl({ title, body, labels }) {
  const params = new URLSearchParams({
    title,
    body,
    labels: labels.join(','),
  });
  return `${repoBase}/issues/new?${params.toString()}`;
}

function buildChipButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip';
  button.textContent = label;
  return button;
}

function getDayOptions() {
  return [...document.querySelectorAll('article.day')].map((dayCard) => {
    const date = dayCard.querySelector('.date')?.textContent?.trim() || 'Unknown date';
    const title = dayCard.querySelector('h3')?.textContent?.trim() || 'Unnamed day';
    return {
      label: `${date} - ${title}`,
      element: dayCard,
    };
  });
}

function getLodgingOptions() {
  return [...document.querySelectorAll('#bookings tbody tr')].map((row) => {
    const area = row.querySelector('td[data-label="Area"]')?.textContent?.trim() || 'Unknown area';
    const property = row.querySelector('td[data-label="Property"] strong')?.textContent?.trim() || 'Unknown property';
    return {
      label: `${property} - ${area}`,
      element: row,
    };
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
  const viewAllButton = document.getElementById('view-all-feedback');
  const cancelButton = document.getElementById('feedback-cancel');
  const typeSelect = document.getElementById('feedback-type');
  const subjectSelect = document.getElementById('feedback-subject');
  const subjectLabel = document.getElementById('feedback-subject-label');
  const nameInput = document.getElementById('feedback-name');
  const detailsInput = document.getElementById('feedback-details');
  const reactionSelect = document.getElementById('feedback-reaction');
  const generalFields = document.getElementById('general-fields');
  const lodgingFields = document.getElementById('lodging-fields');
  const lodgingStatus = document.getElementById('lodging-status');
  const availableFrom = document.getElementById('lodging-available-from');
  const availableTo = document.getElementById('lodging-available-to');
  const lodgingStars = document.getElementById('lodging-stars');
  const form = document.getElementById('feedback-form');
  const latestFeedback = document.getElementById('feedback-latest');

  if (!dialog || !openButton || !cancelButton || !typeSelect || !subjectSelect || !subjectLabel || !form) {
    return;
  }

  const dayOptions = getDayOptions();
  const lodgingOptions = getLodgingOptions();
  let currentContext = { type: 'general', subject: '' };

  function getOptionsForType(type) {
    if (type === 'day') {
      return dayOptions.map((item) => item.label);
    }
    if (type === 'lodging') {
      return lodgingOptions.map((item) => item.label);
    }
    return [];
  }

  function setSubjectValue(preferredSubject) {
    if (!preferredSubject) {
      return;
    }

    const matchingOption = [...subjectSelect.options].find((option) => option.value === preferredSubject);
    if (matchingOption) {
      subjectSelect.value = preferredSubject;
    }
  }

  function syncSubjectField(preferredSubject = '') {
    const type = typeSelect.value;
    const options = getOptionsForType(type);

    if (type === 'general') {
      subjectLabel.style.display = 'none';
      generalFields.hidden = false;
      lodgingFields.hidden = true;
      fillSelect(subjectSelect, [], 'No target needed');
      return;
    }

    subjectLabel.style.display = '';
    fillSelect(
      subjectSelect,
      options,
      type === 'day' ? 'No day targets found' : 'No lodging targets found',
    );
    setSubjectValue(preferredSubject);

    if (type === 'lodging') {
      generalFields.hidden = true;
      lodgingFields.hidden = false;
    } else {
      generalFields.hidden = false;
      lodgingFields.hidden = true;
    }
  }

  function resetFormForContext(type, subject = '') {
    currentContext = { type, subject };
    typeSelect.value = type;
    syncSubjectField(subject);
    if (type !== 'general') {
      setSubjectValue(subject);
    }
  }

  function openFeedbackDialog(type = 'general', subject = '') {
    resetFormForContext(type, subject);
    dialog.showModal();
  }

  function createLauncher(type, subject) {
    const button = buildChipButton('Leave feedback');
    button.addEventListener('click', () => {
      openFeedbackDialog(type, subject);
    });
    return button;
  }

  dayOptions.forEach(({ label, element }) => {
    const host = element.querySelector('.link-row') || element;
    host.appendChild(createLauncher('day', label));
  });

  lodgingOptions.forEach(({ label, element }) => {
    const linkCell = element.querySelector('td[data-label="Link"]');
    if (!linkCell) {
      return;
    }

    const row = document.createElement('div');
    row.className = 'feedback-row';
    row.appendChild(createLauncher('lodging', label));
    linkCell.appendChild(row);
  });

  openButton.addEventListener('click', () => openFeedbackDialog('general'));

  if (viewAllButton && latestFeedback) {
    viewAllButton.addEventListener('click', () => {
      latestFeedback.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const allFilter = document.querySelector('#feedback-filters [data-filter="all"]');
      allFilter?.click();
    });
  }

  cancelButton.addEventListener('click', () => dialog.close());

  typeSelect.addEventListener('change', () => {
    syncSubjectField(currentContext.type === typeSelect.value ? currentContext.subject : '');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const type = typeSelect.value;
    const subject = type === 'general' ? 'Whole itinerary' : subjectSelect.value;
    const submitter = nameInput?.value.trim() || 'Anonymous';
    const details = detailsInput?.value.trim() || 'No additional details provided.';
    const labels = ['feedback'];
    let title = '[General] Trip feedback';

    if (type === 'day') {
      labels.push('day-feedback');
      title = `[Day] ${subject}`;
    } else if (type === 'lodging') {
      labels.push('lodging-update');
      title = `[Lodging] ${subject}`;
    } else {
      labels.push('general-comment');
    }

    const bodyLines = [
      '## Feedback Summary',
      '',
      `- Submitted via: GitHub Pages inline feedback form`,
      `- Submitted by: ${submitter}`,
      `- Feedback type: ${type}`,
      `- Target: ${subject}`,
    ];

    if (type === 'lodging') {
      const rangeStart = availableFrom?.value || 'unspecified';
      const rangeEnd = availableTo?.value || 'unspecified';
      bodyLines.push(`- Availability status: ${lodgingStatus?.value || 'Unclear'}`);
      bodyLines.push(`- Available date range: ${rangeStart} to ${rangeEnd}`);
      bodyLines.push(`- Star rating: ${lodgingStars?.value || '3'} / 5`);
    } else {
      bodyLines.push(`- Overall reaction: ${reactionSelect?.value || 'Neutral'}`);
    }

    bodyLines.push('');
    bodyLines.push('## Details');
    bodyLines.push('');
    bodyLines.push(details);

    window.open(
      buildIssueUrl({
        title,
        body: bodyLines.join('\n'),
        labels,
      }),
      '_blank',
      'noopener',
    );

    dialog.close();
  });

  syncSubjectField();
}

function addFeedbackFilters() {
  const host = document.getElementById('feedback-filters');
  if (!host) {
    return;
  }

  const buttons = [
    { label: 'All', value: 'all' },
    { label: 'Day', value: 'day-feedback' },
    { label: 'Lodging', value: 'lodging-update' },
    { label: 'General', value: 'general-comment' },
  ];

  buttons.forEach((item) => {
    const button = buildChipButton(item.label);
    button.dataset.filter = item.value;
    host.appendChild(button);
  });
}

function renderFeedbackSummary(data) {
  const host = document.getElementById('feedback-summary');
  if (!host) {
    return;
  }

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
    const baseLabel = button.textContent.split(' (')[0];
    const filter = button.dataset.filter;
    const count = filter === 'all' ? counts.all : counts[filter];
    button.textContent = `${baseLabel} (${count})`;
  });

  const summary = document.createElement('p');
  summary.className = 'tiny muted';
  summary.textContent = `Synced ${items.length} feedback items. Last sync: ${data.generatedAt || 'unknown'}.`;
  host.appendChild(summary);

  const row = document.createElement('div');
  row.className = 'feedback-row';

  const openGithub = document.createElement('a');
  openGithub.className = 'chip';
  openGithub.href = buildIssuesQuery(['feedback']);
  openGithub.target = '_blank';
  openGithub.rel = 'noreferrer';
  openGithub.textContent = 'Open GitHub feedback log';
  row.appendChild(openGithub);
  host.appendChild(row);

  const listHost = document.createElement('div');
  listHost.id = 'feedback-items';
  listHost.style.marginTop = '0.9rem';
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

    visibleItems.slice(0, 20).forEach((item) => {
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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
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
