import { useEffect } from 'react';

export default function HeroCarousel({ slides }: { slides: { id: string, title: string, image: string, link: string }[] }) {
  // Ensure Bootstrap's carousel JS is initialized (if using data-bs-ride)
  useEffect(() => {
    // No explicit JS needed if using data attributes and Bootstrap bundle is loaded
  }, []);

  if (!slides.length) return null;

  return (
    <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        {slides.map((slide, idx) => (
          <div key={slide.id} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
            <img src={slide.image} className="d-block w-100" alt={slide.title} />
            <div className="carousel-caption d-none d-md-block">
              <h5>{slide.title}</h5>
            </div>
          </div>
        ))}
      </div>
      {/* Carousel controls */}
      <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}
