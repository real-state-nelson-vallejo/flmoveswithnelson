import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.column}>
                        <div className={styles.logo}>NELSON VALLEJO</div>
                        <p className={styles.description}>
                            Helping families build their future through real estate.
                            Expert guidance in buying, selling, and investing in Florida properties.
                        </p>
                        <div className={styles.socials}>
                            <a href="#" className={styles.socialIcon} aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" className={styles.socialIcon} aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" className={styles.socialIcon} aria-label="LinkedIn"><Linkedin size={20} /></a>
                            <a href="#" className={styles.socialIcon} aria-label="Twitter"><Twitter size={20} /></a>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Services</h4>
                        <Link href="#" className={styles.link}>Buy a Home</Link>
                        <Link href="#" className={styles.link}>Sell a Home</Link>
                        <Link href="#" className={styles.link}>Property Management</Link>
                        <Link href="#" className={styles.link}>Relocation</Link>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Company</h4>
                        <Link href="#" className={styles.link}>About Nelson</Link>
                        <Link href="#" className={styles.link}>Testimonials</Link>
                        <Link href="#" className={styles.link}>Contact</Link>
                        <Link href="#" className={styles.link}>Careers</Link>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.heading}>Contact</h4>
                        <span className={styles.link}>davenport, FL</span>
                        <span className={styles.link}>+1 (555) 123-4567</span>
                        <span className={styles.link}>nelson@example.com</span>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <div>
                        © {currentYear} Nelson Vallejo. All rights reserved.
                    </div>
                    <div className={styles.legal}>
                        <Link href="#" className={styles.link}>Privacy Policy</Link>
                        <Link href="#" className={styles.link}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
