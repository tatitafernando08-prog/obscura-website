import '@google/model-viewer';
import { useReveal } from '../../hooks/useReveal';
import { useAuth } from '../../context/AuthContext';

export function RobotSection() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const viewer = useReveal<HTMLDivElement>();
  const { openSignupModal } = useAuth();

  return (
    <section className="robot-section" id="robot">
      <div ref={label.ref} className={label.className}>IoT Companion</div>
      <h2 ref={title.ref} className={title.className}>Meet NESH in real life.</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>A physical AI robot companion, press a button, ask NESH anything, get a voice response. Coming soon.</p>
      <div ref={viewer.ref} className={`${viewer.className} robot-viewer`}>
        <model-viewer
          src="/assets/nesh-robot.glb"
          alt="NESH Robot 3D model"
          camera-controls
          camera-orbit="0deg 75deg 105%"
          field-of-view="30deg"
          shadow-intensity="1.4"
          exposure="0.75"
          shadow-softness="0.8"
          environment-image="neutral"
          style={{ width: '100%', height: 500, borderRadius: 20, background: '#0D0814' }}
        ></model-viewer>
        <div className="robot-overlay">
          <button type="button" className="robot-overlay-btn" onClick={() => openSignupModal()}>Notify Me</button>
        </div>
      </div>
    </section>
  );
}
