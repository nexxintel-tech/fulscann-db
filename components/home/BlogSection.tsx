import Link from "next/link";
import { homeBlogPosts } from "@/lib/content/home-blog";

export function BlogSection() {
  return (
    <section className="home-blog" aria-labelledby="home-blog-title">
      <div className="home-blog-header">
        <div>
          <span className="section-eyebrow">Insights & Resources</span>
          <h2 id="home-blog-title">Latest insights on trust and growth</h2>
          <p>Stay informed with expert perspectives, industry trends, and practical trust guides.</p>
        </div>
        <Link className="blog-view-all" href="/help/getting-started">
          View all insights
        </Link>
      </div>

      <div className="blog-grid">
        {homeBlogPosts.map((post) => (
          <article key={post.title} className="blog-card">
            <div className="blog-card-image" />
            <div className="blog-card-content">
              <span className="blog-category">{post.category}</span>
              <small>{post.date}</small>
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
              <a className="blog-read-more" href={post.href}>
                Read more &rarr;
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
