
// Sidebar Hover Tooltips for Collapsed Mode
function initSidebarTooltips() {
    const sidebar = document.getElementById('global-sidebar');
    if (!sidebar) return;

    // Create Tooltip Element if not exists
    let tooltip = document.getElementById('sidebar-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'sidebar-tooltip';
        tooltip.className = 'fixed z-[100] hidden pointer-events-none px-3 py-2 rounded-r-lg shadow-lg text-sm font-medium transition-all duration-200 opacity-0 transform -translate-x-4 border-y border-r border-neon-violet/10 dark:border-neon-cyan/20 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 whitespace-nowrap flex items-center';
        // Style notes: 
        // - fixed z-[100]: strictly above everything
        // - hidden: toggled via JS
        // - bg: matching sidebar theme (assuming dark card color)
        // - translate-x-4: start slightly left (under sidebar) to animate out
        document.body.appendChild(tooltip);
    }

    // Attach listeners to all sidebar links
    // We delegate to sidebar to handle dynamically added links if any, 
    // though links are mostly static. Delegation is safer.

    // We actually need to target the links specifically to get their rects.
    const links = sidebar.querySelectorAll('a');

    links.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            // Only show if collapsed
            if (!sidebar.classList.contains('collapsed')) return;

            // Get label text
            const label = link.querySelector('.sidebar-label');
            if (!label) return;
            const text = label.textContent.trim();
            if (!text) return;

            // Positioning
            const rect = link.getBoundingClientRect();

            // Set Content
            tooltip.textContent = text;

            // Set Position
            // Align vertical center with link center
            // Align left edge with link right edge
            // Correction for padding/height diff if any

            tooltip.style.top = `${rect.top}px`;
            tooltip.style.left = `${rect.right}px`;
            tooltip.style.height = `${rect.height}px`; // Match height for "extension" look

            // Show
            tooltip.classList.remove('hidden');
            // Small delay to allow reflow before transiton
            requestAnimationFrame(() => {
                tooltip.classList.remove('opacity-0', '-translate-x-4');
                tooltip.classList.add('opacity-100', 'translate-x-0');
            });
        });

        link.addEventListener('mouseleave', () => {
            // Hide
            tooltip.classList.remove('opacity-100', 'translate-x-0');
            tooltip.classList.add('opacity-0', '-translate-x-4');

            // Wait for transition to finish before display:none
            setTimeout(() => {
                if (tooltip.classList.contains('opacity-0')) {
                    tooltip.classList.add('hidden');
                }
            }, 200);
        });
    });
}
