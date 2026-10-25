
const CFG = {
  scanEveryHours: 6,
  incomingWaitHours: 24,
  outgoingWaitDays: 3,
  lookbackDays: 30,
  maxThreads: 100,
  marker: 'ACTIONABLE_GMAIL_THREAD_ID='
};

function setupAutomation() {
  // Remove duplicate triggers created by this script.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'scanMailbox')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('scanMailbox')
    .timeBased()
    .everyHours(CFG.scanEveryHours)
    .create();

  scanMailbox();
}

function scanMailbox() {
  const myEmail = (Session.getEffectiveUser().getEmail() || '')
    .toLowerCase();

  if (!myEmail) {
    throw new Error('Could not identify your Google account.');
  }

  const threadsById = {};
  const queries = [
    'in:inbox newer_than:30d -category:promotions -category:social',
    'in:sent newer_than:30d'
  ];

  queries.forEach(q => {
    GmailApp.search(q, 0, CFG.maxThreads).forEach(t => {
      threadsById[t.getId()] = t;
    });
  });

  const now = new Date();
  const pending = {};

  Object.values(threadsById).forEach(thread => {
    const messages = thread.getMessages();
    if (!messages.length) return;

    const latest = messages[messages.length - 1];
    const sender = emailAddress(latest.getFrom());
    const subject = thread.getFirstMessageSubject() || '(No subject)';
    const body = latest.getPlainBody().slice(0, 5000);
    const text = (subject + '\n' + body).toLowerCase();

    if (isAutomated(sender, latest)) return;

    const fromMe = sender === myEmail;
    const ageHours = (now - latest.getDate()) / 3600000;

    if (!fromMe) {
      // Only remind for incoming messages that appear to require action.
      if (ageHours < CFG.incomingWaitHours) return;
      if (!needsMyReply(text)) return;

      pending[thread.getId()] = {
        kind: 'REPLY NEEDED',
        subject,
        sender: latest.getFrom(),
        date: latest.getDate(),
        url: 'https://mail.google.com/mail/u/0/#all/' +
          thread.getId(),
        due: new Date(
          latest.getDate().getTime() +
          CFG.incomingWaitHours * 3600000
        )
      };
    } else {
      // Outgoing emails qualify only if they appear to request a response.
      if (ageHours < CFG.outgoingWaitDays * 24) return;
      if (!expectsResponse(text)) return;

      pending[thread.getId()] = {
        kind: 'FOLLOW-UP',
        subject,
        sender: latest.getFrom(),
        date: latest.getDate(),
        url: 'https://mail.google.com/mail/u/0/#all/' +
          thread.getId(),
        due: new Date(
          latest.getDate().getTime() +
          CFG.outgoingWaitDays * 86400000
        )
      };
    }
  });

  syncCalendar(pending, now);
}

function needsMyReply(text) {
  const cues = [
    /\?/, 
    /\bplease (confirm|send|share|provide|review|approve|respond|reply|let me know)\b/,
    /\b(could|can|would) you\b/,
    /\b(action required|your approval|your confirmation)\b/,
    /\b(please advise|need your response|waiting for your response)\b/,
    /\b(deadline|due by|by tomorrow|by today)\b/
  ];

  const nonActionable = [
    /\b(unsubscribe|view in browser)\b/,
    /\b(no reply needed|no action required|for your information)\b/
  ];

  if (nonActionable.some(r => r.test(text))) return false;
  return cues.some(r => r.test(text));
}

function expectsResponse(text) {
  const cues = [
    /\?/, 
    /\bplease (confirm|reply|respond|review|approve|send|share|let me know)\b/,
    /\b(could|can|would) you\b/,
    /\b(let me know|looking forward to your response)\b/,
    /\b(awaiting|waiting for) (your )?(reply|response|approval|confirmation)\b/,
    /\bplease get back to me\b/
  ];

  const nonActionable = [
    /\b(thanks|thank you) for (your|the) (email|update|help)\b/,
    /\b(no reply needed|no action required)\b/
  ];

  if (nonActionable.some(r => r.test(text))) return false;
  return cues.some(r => r.test(text));
}

function isAutomated(sender, message) {
  const from = (sender || '').toLowerCase();
  const subject = (message.getSubject() || '').toLowerCase();

  return /no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer-daemon|notifications?@/.test(from) ||
    /\b(automated notification|weekly digest|daily digest)\b/.test(subject);
}

function emailAddress(from) {
  const match = (from || '').match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

function syncCalendar(pending, now) {
  const calendar = CalendarApp.getDefaultCalendar();
  const events = calendar.getEvents(
    new Date(now.getTime() - 35 * 86400000),
    new Date(now.getTime() + 60 * 86400000)
  );

  const existing = {};

  events.forEach(event => {
    const desc = event.getDescription() || '';
    const match = desc.match(
      /ACTIONABLE_GMAIL_THREAD_ID=([^\s]+)/
    );
    if (match) existing[match[1]] = event;
  });

  // Clear reminders for threads that no longer qualify.
  Object.keys(existing).forEach(id => {
    if (!pending[id]) existing[id].deleteEvent();
  });

  Object.entries(pending).forEach(([id, item]) => {
    const old = existing[id];

    // Keep an existing future reminder to avoid duplicates.
    if (old && old.getStartTime() > now) return;
    if (old) old.deleteEvent();

    const start = item.due > now
      ? item.due
      : new Date(now.getTime() + 30 * 60000);

    const event = calendar.createEvent(
      item.kind + ': ' + item.subject,
      start,
      new Date(start.getTime() + 15 * 60000),
      {
        description: [
          CFG.marker + id,
          'Type: ' + item.kind,
          'Latest sender: ' + item.sender,
          'Last message: ' + item.date.toLocaleString(),
          '',
          'Open Gmail thread:',
          item.url,
          '',
          'Review the conversation before replying.'
        ].join('\n')
      }
    );

    // Notification 5 minutes before the event.
    event.addPopupReminder(5);
  });
}
