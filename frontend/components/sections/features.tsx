"use client";

import { useState, useRef, useEffect } from "react";

export default function Features() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("mousemove", handleMouseMove);
            return () =>
                container.removeEventListener("mousemove", handleMouseMove);
        }
    }, []);

  const cards = [
    {
      id: 1,
      title: "Trained on Your Store’s Data",
      description: "Connect your FAQs, shipping policies, and product catalogs in one click. The AI instantly learns everything about your brand to deliver perfectly accurate, brand-aligned answers 24/7.",
      buttonText: "See how it learns",
      features: [
        "Instant Knowledge Sync"
      ]
    },
    {
      id: 2,
      title: "Context-Aware Conversations",
      description: "Customers don't talk like robots, and neither should your bot. Our engine remembers previous messages and understands follow-up questions, providing a fluid experience just like a real sales assistant.",
      buttonText: "See it in action",
      features: [
        "Natural Multi-Turn Chat",
      ]
    },
    {
      id: 3,
      title: "Seamless Human Handoff",
      description: "Never lose a complex sale. When the AI detects a tricky question or a frustrated customer, it pauses automatically and alerts your team. Jump right into the chat from your dashboard without missing a beat.",
      buttonText: "Explore the dashboard",
      features: [
        "Smart Agent Escalation",
      ]
    },
    {
      id: 4,
      title: "Blazing Fast Responses",
      description: "Speed kills cart abandonment. Powered by advanced semantic caching, our widget delivers instant answers to frequently asked questions, keeping your shoppers engaged and ready to buy.",
      buttonText: "Learn about performance",
      features: [
        "Zero-Wait Customer Support",
      ]
    },
    {
      id: 5,
      title: "Setup in Minutes, Not Weeks",
      description: "No developer required. Just paste a single snippet of code into your Shopify, WooCommerce, or custom website, and your intelligent assistant is ready to chat with your customers.",
      buttonText: "Get your snippet",
      features: [
        "Universal Plug & Play Integration",
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-primary relative overflow-hidden pb-4">
      {/* Background gradient effect */}
      <div 
        ref={containerRef}
        className="relative min-h-screen"
        style={{
          background: hoveredCard !== null ? 
            `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 70%)` :
            'transparent'
        }}
      >
        {/* Header */}
        <div className="text-center pt-20 pb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-primary">
            The fast way to actually
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold text-orange-400">
            get AI working in your business
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`relative bg-card backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600/70 ${
                index === 0 ? 'xl:col-span-1' : ''
              } ${
                index === 1 ? 'xl:col-span-1' : ''
              } ${
                index === 2 ? 'xl:col-span-1 xl:col-start-1 xl:row-start-2 xl:col-span-2' : ''
              }`}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 leading-tight">
                  {card.title}
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {card.description}
                </p>

                {/* Features list */}
                {card.features.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}

                {/* Button */}
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center">
                  {card.buttonText}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                {/* Special content for first card */}
                {/* {card.id === 1 && (
                  <div className="mt-8 relative">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Self hosted badge for third card */}
                {card.id === 3 && (
                  <div className="mt-6">
                    <div className="inline-block bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                      SELF HOSTED
                    </div>
                  </div>
                )}
              </div>

              {/* Hover glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  hoveredCard === card.id ? "opacity-20" : "opacity-0"
                }`}
                style={{
                  background:
                    hoveredCard === card.id
                      ? "radial-gradient(circle at center, rgba(59, 130, 246, 0.3), transparent 70%)"
                      : "transparent",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
