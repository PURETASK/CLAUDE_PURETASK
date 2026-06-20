'use client';

/** Extra ambient orbs on dashboard — visual only, no sound. */
export const DashboardBubbleAmbience = () => (
  <div className="dashboard-bubble-ambience" aria-hidden>
    <span className="dashboard-bubble-ambience__orb dashboard-bubble-ambience__orb--a" />
    <span className="dashboard-bubble-ambience__orb dashboard-bubble-ambience__orb--b" />
  </div>
);
