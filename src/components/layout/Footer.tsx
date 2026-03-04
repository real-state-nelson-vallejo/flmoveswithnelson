import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Image from "next/image";
import styles from "./Footer.module.css";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.column}>
                        <div className={styles.logo} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Image src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo-blanco.png?alt=media&token=e6caedc9-a247-4e7d-a4ed-c3af55912c4d" alt="Nelson Vallejo Logo" width={140} height={40} style={{ objectFit: 'contain' }} />
                            <Image src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fvesti.png?alt=media&token=8a715137-32d4-4935-b2b0-8c1bf9597708" alt="Vesti Logo" width={90} height={35} style={{ objectFit: 'contain' }} />
                            <Image src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fequal-housing-opportunity.png?alt=media&token=9ff72c53-ee77-400c-8f73-bb487e528a92" alt="Equal Housing Logo" width={40} height={40} style={{ objectFit: 'contain', borderRadius: '4px' }} />
                        </div>
                        <p className={styles.description}>
                            Helping families build their future through real estate.
                            Expert guidance in buying, selling, and investing in Florida properties.
                        </p>
                        <div className={styles.socials}>
                            <a href="https://www.facebook.com/nelson.vallejo.3" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com/nvrealestate.cfl" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="https://www.youtube.com/@NelsonVallejorealtor" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="YouTube"><Youtube size={20} /></a>
                            <a href="https://www.tiktok.com/@nvrealestate.cfl" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="TikTok">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Services</h4>
                        <Link href="/services#buy" className={styles.link}>Buy a Home</Link>
                        <Link href="/services#sell" className={styles.link}>Sell a Home</Link>
                        <Link href="/services#rent-a-home" className={styles.link}>Rent a Home</Link>
                        <Link href="/services#rent-my-home" className={styles.link}>Rent My Home</Link>
                        <Link href="/services#investing" className={styles.link}>Investing & Wealth</Link>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Company</h4>
                        <Link href="/about" className={styles.link}>About Me</Link>
                        <Link href="/#contact" className={styles.link}>Contact</Link>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Contact</h4>
                        <span className={styles.link}>Polk County, FL</span>
                        <span className={styles.link}>(352) 243-5370</span>
                        <a href="mailto:Vallejonelson1722@gmail.com" className={styles.link}>Vallejonelson1722@gmail.com</a>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <div>
                        © {currentYear} Nelson Vallejo. All rights reserved.
                    </div>
                    <div className={styles.legal}>
                        <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
                        <Link href="/terms" className={styles.link}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
