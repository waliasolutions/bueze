import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Wrench, Hammer, Zap, Droplets, Paintbrush, TreePine, Clock, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { value: 'elektriker', label: 'Elektriker', icon: Zap },
  { value: 'sanitaer', label: 'Sanitär', icon: Droplets },
  { value: 'maler', label: 'Maler', icon: Paintbrush },
  { value: 'zimmermann', label: 'Zimmermann', icon: Hammer },
  { value: 'gartenbau', label: 'Gartenbau', icon: TreePine },
  { value: 'allgemein', label: 'Allgemeine Arbeiten', icon: Wrench },
];

const urgencyOptions = [
  { value: 'today', label: 'Heute' },
  { value: 'this_week', label: 'Diese Woche' },
  { value: 'this_month', label: 'Dieser Monat' },
  { value: 'planning', label: 'Flexibel' },
];

const budgetRanges = [
  { value: '0-500', label: 'Bis 500 CHF' },
  { value: '500-1500', label: '500 - 1\'500 CHF' },
  { value: '1500-5000', label: '1\'500 - 5\'000 CHF' },
  { value: '5000+', label: 'Über 5\'000 CHF' },
];

export const HeroSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Build search URL with parameters
    const searchParams = new URLSearchParams();
    
    if (searchQuery.trim()) searchParams.set('q', searchQuery.trim());
    if (category) searchParams.set('category', category);
    if (location.trim()) searchParams.set('location', location.trim());
    if (budget) searchParams.set('budget', budget);
    if (urgency) searchParams.set('urgency', urgency);
    
    // Navigate to search page using React Router
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-8 bg-surface shadow-xl border-0">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ink-900 mb-2">
          Worauf brauchen Sie Hilfe?
        </h2>
        <p className="text-ink-500">
          Finden Sie geprüfte Handwerker in Ihrer Nähe
        </p>
      </div>

      <div className="grid gap-6">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-500 h-5 w-5" />
          <Input
            placeholder="z.B. Elektriker in Zürich unter 500 CHF"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-base border-line-200 bg-surface rounded-2xl focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-700">Kategorie</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 border-line-200 bg-surface rounded-xl">
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-brand-500" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-700">Ort oder PLZ</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-500 h-4 w-4" />
              <Input
                placeholder="z.B. Zürich, 8001"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12 border-line-200 bg-surface rounded-xl focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-700">Budget (CHF)</label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-12 border-line-200 bg-surface rounded-xl">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-ink-500" />
                  <SelectValue placeholder="Budget wählen" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-700">Dringlichkeit</label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="h-12 border-line-200 bg-surface rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ink-500" />
                  <SelectValue placeholder="Zeitrahmen" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {urgencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button */}
        <Button 
          onClick={handleSearch}
          variant="hero"
          size="xl"
          className="w-full"
        >
          <Search className="h-5 w-5" />
          Jetzt Handwerker finden
        </Button>
      </div>
    </Card>
  );
};