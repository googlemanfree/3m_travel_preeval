import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  country: string;
  visaType: string;
  rating: number;
  comment: string;
  avatarUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Fatima Zohra',
    country: 'Maroc',
    visaType: 'Visa Étudiant Canada',
    rating: 5,
    comment: "Grâce à 3M Travel, j'ai pu réaliser mon rêve d'étudier au Canada. Leur accompagnement a été exceptionnel, du début à la fin. Je recommande vivement !",
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: 2,
    name: 'Ahmed Diallo',
    country: 'Sénégal',
    visaType: 'Visa de Travail Luxembourg',
    rating: 5,
    comment: "J'ai obtenu mon visa de travail pour le Luxembourg en un temps record. L'équipe de 3M Travel est très professionnelle et réactive. Un grand merci !",
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: 3,
    name: 'Sophie Dubois',
    country: 'France',
    visaType: 'Visa Touristique Schengen',
    rating: 4,
    comment: "Mon voyage en Europe a été parfait grâce à leur aide pour le visa Schengen. Quelques petits retards, mais le résultat était là. Satisfaite !",
    avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
  {
    id: 4,
    name: 'Moussa Traoré',
    country: 'Mali',
    visaType: 'Visa Étudiant Pologne',
    rating: 5,
    comment: "J'ai été accepté dans une université en Pologne ! 3M Travel a géré toutes les démarches administratives avec brio. Je suis très reconnaissant.",
    avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
  },
  {
    id: 5,
    name: 'Léa Martin',
    country: 'Belgique',
    visaType: 'Visa de Travail Canada',
    rating: 5,
    comment: "Le processus pour mon visa de travail au Canada était complexe, mais 3M Travel a tout simplifié. Leur expertise est inégalable. Merci !",
    avatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full"
  >
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{testimonial.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{testimonial.country} - {testimonial.visaType}</p>
          </div>
        </div>
        <div className="flex items-center mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-500' : 'text-gray-300'}`}
              fill={i < testimonial.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-base leading-relaxed">{testimonial.comment}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Ce que nos clients disent de nous
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
