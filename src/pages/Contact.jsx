import { Icon, BrandMark } from '../components/Icons.jsx'
import { COMPANY, KOL } from '../config.js'

export default function Contact() {
  const mapQuery = encodeURIComponent('ST Moritz, 1014 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, Hồ Chí Minh')
  return (
    <>
      <section className="contact-hero">
        <div className="wrap">
          <h1>Liên hệ với chúng tôi</h1>
          <p>WellHome luôn sẵn sàng hỗ trợ bạn. Liên hệ ngay để được tư vấn sản phẩm Tefal chính hãng cùng KOL {KOL.name}.</p>
        </div>
      </section>

      <div className="wrap">
        <div className="contact-grid">
          <div className="contact-card">
            <div className="co-brand-bar">
              <BrandMark size={38} />
              <span style={{ fontSize: 23, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-.4px' }}>WellHome</span>
            </div>

            <div className="contact-list">
              <div className="contact-row a">
                <span className="ic"><Icon name="pin" size={22} /></span>
                <div>
                  <div className="lab">Địa chỉ</div>
                  <div className="val">{COMPANY.address}</div>
                </div>
              </div>
              <div className="contact-row b">
                <span className="ic"><Icon name="phone" size={22} /></span>
                <div>
                  <div className="lab">Hotline</div>
                  <div className="val"><a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`}>{COMPANY.hotline}</a></div>
                </div>
              </div>
              <div className="contact-row c">
                <span className="ic"><Icon name="mail" size={22} /></span>
                <div>
                  <div className="lab">Email</div>
                  <div className="val"><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{COMPANY.legalName}</div>
              <div>{COMPANY.copyright}</div>
              <div><b>Chịu trách nhiệm nội dung:</b> {COMPANY.contentResponsibility}</div>
            </div>
          </div>

          <div className="contact-card" style={{ padding: 0, overflow: 'hidden' }}>
            <iframe
              className="map-embed"
              title="Bản đồ WellHome"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '40px 20px 60px' }}>
        <div className="contact-card" style={{ textAlign: 'center', background: 'linear-gradient(160deg,#EAF8FF,#fff)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>Cần tư vấn nhanh?</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>Gọi ngay hotline hoặc gửi email, đội ngũ WellHome sẽ phản hồi trong thời gian sớm nhất.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`} className="btn btn-primary btn-lg"><Icon name="phone" size={18} /> {COMPANY.hotline}</a>
            <a href={`mailto:${COMPANY.email}`} className="btn btn-ghost btn-lg"><Icon name="mail" size={18} /> Gửi email</a>
          </div>
        </div>
      </div>
    </>
  )
}
