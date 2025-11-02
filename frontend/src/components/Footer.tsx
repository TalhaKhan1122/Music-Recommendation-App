import React from 'react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logo?: string;
  sections?: FooterSection[];
  copyright?: string;
  socialLinks?: Array<{ name: string; href: string; icon?: React.ReactNode }>;
}

const Footer: React.FC<FooterProps> = ({
  logo = 'MR App',
  sections = [],
  copyright = `© ${new Date().getFullYear()} MR App. All rights reserved.`,
  socialLinks = []
}) => {
  return (
    <footer className="w-full bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">{logo}</h3>
            <p className="text-sm text-gray-400">
              Building scalable solutions for the future.
            </p>
          </div>

          {/* Footer Sections */}
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  {social.icon || social.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

