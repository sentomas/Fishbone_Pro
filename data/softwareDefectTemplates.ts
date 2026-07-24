import { SoftwareDefectTemplate } from '../types';

export const SOFTWARE_DEFECT_TEMPLATES: SoftwareDefectTemplate[] = [
  {
    id: 'api-timeout',
    title: 'High API Latency & HTTP 504 Timeout',
    problem: 'REST API response time exceeded SLA (>5s) causing gateway timeouts during peak user traffic',
    framework: 'software',
    badge: 'Backend / Performance',
    causes: [
      { text: 'Unindexed SQL JOIN query in hot execution path', category: 'Data & Storage' },
      { text: 'Unbounded nested loop inside payload parser', category: 'Code & Logic' },
      { text: 'Node.js event loop blocked by synchronous crypto call', category: 'Code & Logic' },
      { text: 'K8s Pod CPU throttle due to insufficient resource limits', category: 'Environment & Config' },
      { text: 'Load testing skipped during sprint hotfix release', category: 'Testing & QA' },
      { text: 'Third-party OAuth provider experiencing API degradation', category: 'Integration & Dependencies' },
      { text: 'Redis caching cluster connection pool exhausted', category: 'Environment & Config' },
      { text: 'PR reviewed without query plan inspection rule', category: 'Process & Workflow' }
    ],
    fiveWhys: [
      'Why did API response times spike above 5000ms? Because database queries stalled waiting for locks.',
      'Why did database queries stall on locks? Because a slow query scanned 2,000,000 table rows.',
      'Why did the query scan the entire table? Because the new filter column lacked a database index.',
      'Why was the database index missing in production? Because the database migration script was not executed during deployment.',
      'Why was the migration script skipped? Because the manual deployment checklist lacked a migration validation step.'
    ],
    checklist: [
      'Verify DB execution plan with EXPLAIN ANALYZE on query',
      'Check Redis connection pool metrics and hit ratios',
      'Audit Node.js event loop lag and CPU utilization spikes',
      'Validate missing database index creation in staging environment',
      'Automate migration runner step in CI/CD release workflow'
    ]
  },
  {
    id: 'null-pointer-crash',
    title: 'Production App Crash: Unhandled Exception',
    problem: 'Frontend application crashes with "TypeError: Cannot read property of undefined" when users open checkout',
    framework: 'software',
    badge: 'Frontend / Crash',
    causes: [
      { text: 'Missing optional chaining on user address object', category: 'Code & Logic' },
      { text: 'API response structure changed breaking schema contract', category: 'Integration & Dependencies' },
      { text: 'Staging environment mock data contained valid addresses only', category: 'Testing & QA' },
      { text: 'TypeScript strict Null checks disabled in compiler config', category: 'Environment & Config' },
      { text: 'Feature flag enabled for all users without canary rollout', category: 'Process & Workflow' },
      { text: 'No error boundary fallback component around Checkout view', category: 'Code & Logic' }
    ],
    fiveWhys: [
      'Why did the React app crash on the checkout page? Uncaught TypeError in user profile rendering component.',
      'Why was the exception uncaught? The component lacked a React ErrorBoundary and optional chaining.',
      'Why was the user address object null? Guest checkout users do not have a pre-saved profile address.',
      'Why was guest checkout state not tested? Test scenarios only validated logged-in accounts.',
      'Why were guest checkout tests omitted? QA test matrix was not updated when guest checkout was introduced.'
    ],
    checklist: [
      'Add React ErrorBoundary fallback UI around checkout route',
      'Apply optional chaining (?.) and default fallback values to address fields',
      'Enable strictNullChecks in tsconfig.json',
      'Add automated E2E test for guest user checkout flow',
      'Update PR template requiring edge-case payload validation'
    ]
  },
  {
    id: 'memory-leak',
    title: 'Server Memory Leak & OOM Container Restarts',
    problem: 'Node.js microservice memory grows continuously over 24 hours until killed by Kubernetes Out-Of-Memory (OOM)',
    framework: 'software',
    badge: 'DevOps / Reliability',
    causes: [
      { text: 'Unsubscribed EventEmitter listeners in WebSockets module', category: 'Code & Logic' },
      { text: 'In-memory cache object grows indefinitely without LRU eviction', category: 'Data & Storage' },
      { text: 'Large file upload read into buffer instead of streaming', category: 'Code & Logic' },
      { text: 'Garbage Collection heap limit improperly set in Dockerfile', category: 'Environment & Config' },
      { text: 'Long-running leak tests not included in nightlies', category: 'Testing & QA' },
      { text: 'Third-party logging library holding reference to HTTP requests', category: 'Integration & Dependencies' }
    ],
    fiveWhys: [
      'Why did the container crash with OOM status? Node.js heap allocation exceeded memory limit of 1.5GB.',
      'Why did heap memory allocation keep increasing? Event listeners were attached per HTTP request without being detached.',
      'Why were event listeners attached per request? Global event emitter was used inside local request handler closure.',
      'Why was this pattern approved in code review? Reviewers focused on functional logic rather than memory profiling.',
      'Why was memory profiling absent? CI pipeline lacks automated memory heap benchmark tests.'
    ],
    checklist: [
      'Capture heap snapshot using Chrome DevTools / v8 profiler',
      'Replace in-memory JS map with bounded LRU cache or Redis',
      'Refactor request handlers to use scoped event streams',
      'Set V8 --max-old-space-size explicitly in Dockerfile startup script',
      'Add heap usage trend alerting to Prometheus / Grafana'
    ]
  },
  {
    id: 'data-desync',
    title: 'Distributed State & Payment Desynchronization',
    problem: 'User account debited successfully, but order status remains marked as "Payment Pending" in database',
    framework: 'software',
    badge: 'Distributed Systems / Fintech',
    causes: [
      { text: 'Payment webhook handler lacks idempotent duplicate check', category: 'Code & Logic' },
      { text: 'Clock skew between microservice nodes (>300ms drift)', category: 'Environment & Config' },
      { text: 'Database transaction committed before external call completed', category: 'Data & Storage' },
      { text: 'Webhook retry queue messages arrived out of order', category: 'Integration & Dependencies' },
      { text: 'Eventual consistency delay not communicated to UI', category: 'Process & Workflow' },
      { text: 'Network partition simulation omitted from integration suite', category: 'Testing & QA' }
    ],
    fiveWhys: [
      'Why was the order status left as "Pending"? The order service did not process the payment confirmation webhook.',
      'Why did the webhook fail to process? The payment gateway sent a duplicate webhook that hit a unique constraint error.',
      'Why did duplicate webhook cause an unhandled error? The handler attempted raw INSERT instead of UPSERT / idempotent check.',
      'Why was idempotency not built in? Developer assumed payment gateway webhooks are delivered strictly once.',
      'Why was API integration documentation misunderstood? Third-party API integration guidelines were not reviewed during technical design.'
    ],
    checklist: [
      'Implement Idempotency-Key handling on webhook endpoints',
      'Wrap payment status updates in atomic database transactions',
      'Configure NTP time synchronization across all Kubernetes cluster nodes',
      'Add reconciliation cron job to automatically sync orphan payment records',
      'Write integration tests simulating duplicate and delayed webhooks'
    ]
  }
];
