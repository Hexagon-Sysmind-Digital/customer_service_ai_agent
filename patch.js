const fs = require('fs');
const path = require('path');

const files = [
  'src/app/faqs/page.tsx',
  'src/app/chat/page.tsx',
  'src/app/knowledge/page.tsx',
  'src/app/ai-actions/page.tsx',
  'src/app/reservation-templates/page.tsx',
  'src/app/reservations/page.tsx'
];

for (const file of files) {
  const absolutePath = path.join('c:\\laragon\\www\\aiagent', file);
  if (!fs.existsSync(absolutePath)) {
    console.log("Skipping " + file);
    continue;
  }
  let content = fs.readFileSync(absolutePath, 'utf8');

  let patch = `const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) {
          finalTenants = [tenantRes.data];
        } else if (user.role === 'user' && (tenantRes.error?.includes('403') || tenantRes.error?.includes('Forbidden'))) {
          // Silent fallback for regular users to avoid 403 banners
          finalTenants = [{ id: user.tenant_id, name: '' } as any];
        } else`;
    
  if (content.includes("const tenantRes = await fetchTenantById(user.tenant_id);") && !content.includes("Silent fallback for regular users to avoid 403 banners")) {
    content = content.replace(/const tenantRes = await fetchTenantById\(user\.tenant_id\);\s*if \(tenantRes\.success\) \{\s*finalTenants = \[(?:tenantRes\.data|tenantRes\.data \|\| tenantRes)\];\s*\} else/g, patch);
    
    fs.writeFileSync(absolutePath, content);
    console.log("Patched " + file);
  } else {
    console.log("No match found or already patched for " + file);
    
    // Some lines might be slightly different:
    // finalTenants = [tenantRes.data];
  }
}
