export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container-high py-space-xl">
      <div className="w-full px-gutter max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl pb-space-lg">
          <div className="md:col-span-2 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <img
                alt="Sahodaya Competition Crest Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VzdeT3PkbBQ7loP1joOY07c3sTlUemNtjei0_I73t--gT4jaDo8zFpYjgy2bP0y8OP3rFGXTf_jAYQ80sOEefiMuS0FNSlbv00OBCgPrbNggtKXZoGjbga0uorPqU_oZURXYQ98TcP-AQ9sIJ6XrYMB6DPD5AGpzdRCaP_ia7lon2scxfBFvnLK0EhxesWf5pC-mw7irO475j2gWHJbPDuXMkdF7S5orxaV5-QQWHZxbSmfP4U7ySCEqw"
              />
              <span className="font-title-md text-title-md text-primary font-bold tracking-tight">
                SAHODAYA INTER-SCHOOL COMPETITION 2026
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
              Celebrating excellence, inter-school camaraderie, and athletic and cultural mastery under the unified aegis of the Sahodaya School Complex.
            </p>
            <div className="flex items-center gap-space-xs mt-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Affiliation:
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                CBSE Autonomous Cluster Board Verified
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-primary font-bold mb-space-xs">
              Quick Navigation
            </span>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Tournament Scoreboard
            </a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Participating Schools (100)
            </a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Schedules &amp; Fixtures
            </a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Official Tallies &amp; Results
            </a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              Podium &amp; Medals
            </a>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-primary font-bold mb-space-xs">
              Organizing Committee
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Central Sahodaya Secretariat
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Athletic Directorate &amp; Cultural Board
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Inquiries: secretariat@sahodaya2026.edu
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Helpline: +91 (0) 80 2345 6789
            </p>
          </div>
        </div>
        <div className="pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 Sahodaya Inter-School Complex. All rights reserved.
          </p>
          <div className="flex items-center gap-space-md">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Admin Portal
            </a>
            <span className="text-outline-variant">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Official Tournament Scorer Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
