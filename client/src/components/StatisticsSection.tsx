import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, Globe, Award } from "lucide-react";

interface StatisticItemProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  delay: number;
}

const StatisticItem = ({ icon, value, suffix = "", label, delay }: StatisticItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let current = 0;
    const increment = value / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full">
          <div className="text-blue-600 w-8 h-8">{icon}</div>
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">
        {displayValue.toLocaleString()}{suffix}
      </div>
      <p className="text-gray-600 font-medium">{label}</p>
    </motion.div>
  );
};

export default function StatisticsSection() {
  const statistics = [
    {
      icon: <Users className="w-full h-full" />,
      value: 1500,
      label: "Clients Accompagnés",
      delay: 0,
    },
    {
      icon: <CheckCircle2 className="w-full h-full" />,
      value: 98,
      suffix: "%",
      label: "Taux de Succès",
      delay: 0.1,
    },
    {
      icon: <Globe className="w-full h-full" />,
      value: 30,
      suffix: "+",
      label: "Pays Desservis",
      delay: 0.2,
    },
    {
      icon: <Award className="w-full h-full" />,
      value: 12,
      label: "Années d'Expérience",
      delay: 0.3,
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Nos Chiffres Parlent d'Eux-Mêmes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Depuis plus d'une décennie, nous accompagnons des milliers de candidats vers la réalisation de leurs rêves.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statistics.map((stat, index) => (
            <StatisticItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-6">
            Rejoignez des milliers de clients satisfaits qui ont réalisé leurs projets avec nous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Évaluer Mon Éligibilité
            </button>
            <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Prendre Rendez-vous
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
