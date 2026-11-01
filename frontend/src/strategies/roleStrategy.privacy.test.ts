import { describe, expect, it } from 'vitest';
import { isRouteAllowed } from './roleStrategy';

describe('privacy routes by role', () => {
  it.each(['STUDENT', 'TEACHER'])('%s can open My Privacy but not the admin area', (role) => {
    expect(isRouteAllowed(role, '/my-privacy')).toBe(true);
    expect(isRouteAllowed(role, '/privacy-admin')).toBe(false);
    expect(isRouteAllowed(role, '/privacy-admin/requests/5')).toBe(false);
  });

  it('college admin can open the admin area including request details, but not My Privacy', () => {
    expect(isRouteAllowed('COLLEGEADMIN', '/privacy-admin')).toBe(true);
    expect(isRouteAllowed('COLLEGEADMIN', '/privacy-admin/requests/5')).toBe(true);
    expect(isRouteAllowed('COLLEGEADMIN', '/my-privacy')).toBe(false);
  });

  it.each(['HOD', 'SUPERADMIN'])('%s has no privacy pages in this release', (role) => {
    expect(isRouteAllowed(role, '/my-privacy')).toBe(false);
    expect(isRouteAllowed(role, '/privacy-admin')).toBe(false);
  });
});
