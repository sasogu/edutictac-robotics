/*
 * Copyright (C) 2024-2025 EDUmind - Los Mundos Edufis
 * Copyright (C) 2026 EduTicTac
 * Author: Luis Vilela Acuña
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import './EduTicTacFooter.css';

interface NavigationLink {
    href: string;
    label?: string;
}

interface EduTicTacFooterProps {
    appName: string;
    version: string;
    versionStage?: 'Alpha' | 'Beta' | 'Stable' | 'RC';
    author?: string;
    year?: number;
    previousPage?: NavigationLink;
    nextPage?: NavigationLink;
    homeHref?: string;
    feedbackUrl?: string;
    feedbackLabel?: string;
    className?: string;
    locale?: 'es' | 'en' | 'zh';
    hideNavigation?: boolean;
    showVersion?: boolean;
}

interface FooterTranslations {
    previous: string;
    next: string;
    copyright: string;
    feedback: string;
    home: string;
}

const translations: Record<string, FooterTranslations> = {
    es: {
        previous: '← Anterior',
        next: 'Siguiente →',
        copyright: '© {year} EduTicTac por',
        feedback: '📋 Reportar Error',
        home: '🏠 Inicio'
    },
    en: {
        previous: '← Previous',
        next: 'Next →',
        copyright: '© {year} EduTicTac by',
        feedback: '📋 Report Issue',
        home: '🏠 Home'
    },
    zh: {
        previous: '← 上一页',
        next: '下一页 →',
        copyright: '© {year} EduTicTac 由',
        feedback: '📋 报告问题',
        home: '🏠 首页'
    }
};

export default function EduTicTacFooter({
    version,
    versionStage,
    feedbackUrl,
    feedbackLabel,
    className = '',
    locale = 'es',
    showVersion = true
}: EduTicTacFooterProps) {
    const t = translations[locale] || translations.es;

    const versionBadge = versionStage
        ? `v${version} (${versionStage})`
        : `v${version}`;

    return (
        <footer className={`edutictac-footer ${className}`}>
            <div className="footer-info">
                <p className="footer-license" style={{ fontSize: '0.875rem' }}>
                    Software libre con licencia{' '}
                    <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>AGPL-3.0-or-later</a>
                    {' / '}
                    <a href="https://eupl.eu/1.2/es/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>EUPL-1.2</a>
                    <span style={{ margin: '0 0.5rem' }}>·</span>
                    <a href="https://github.com/edumind-es/edumind-robotics" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                        Derivado de EDUmind Robotics Lab
                    </a>
                </p>
            </div>

            <div className="footer-meta">
                {showVersion && (
                    <span className="badge version-badge">{versionBadge}</span>
                )}
                {feedbackUrl && (
                    <a
                        href={feedbackUrl}
                        className="feedback-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={feedbackLabel || t.feedback}
                    >
                        {feedbackLabel || t.feedback}
                    </a>
                )}
            </div>
        </footer>
    );
}
