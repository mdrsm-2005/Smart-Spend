import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (api.getToken()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <>
      <div className="landing-hero">
        <nav className="landing-nav">
          <div className="logo">
            <i className="fa-solid fa-chart-pie"></i> Smart<span>Spend</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-outline">Log In</Link>
            <Link to="/register" className="btn btn-primary">Start for Free</Link>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-text">
            <h1>AI Powered Expense Intelligence Platform</h1>
            <p>Track. Analyze. Save smarter. Take full control of your finances with real-time tracking, intelligent budgeting, and actionable savings insights.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-mockup">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600" alt="Dashboard Preview" />
            </div>
          </div>
        </div>
      </div>

      <section className="features-section">
        <div className="section-header">
          <h2>Track everything. Understand deeply.</h2>
          <p>Everything you need to manage your personal finances like a pro.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-money-bill-wave"></i></div>
            <h3>Expense Tracking</h3>
            <p>Log your daily expenses effortlessly. Categorize them and add notes to keep a meticulous record of where your money goes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
            <h3>Advanced Analytics</h3>
            <p>Visualize your spending habits over time with interactive charts. Spot trends and cut unnecessary costs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-lightbulb"></i></div>
            <h3>Smart Insights</h3>
            <p>Our intelligent system analyzes your spending patterns and provides actionable suggestions to help you hit your savings goals.</p>
          </div>
        </div>
      </section>
    </>
  );
}
