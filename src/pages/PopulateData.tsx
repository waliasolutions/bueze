import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { populateTestData } from '@/utils/testData';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PopulateData() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handlePopulateData = async () => {
    setIsPopulating(true);
    setResults(null);
    
    try {
      const populationResults = await populateTestData();
      setResults(populationResults);
    } catch (error) {
      console.error('Error populating data:', error);
      setResults({ errors: [String(error)] });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Test Data Population</CardTitle>
              <CardDescription>
                Populate the database with comprehensive test data including users, handwerker profiles, leads, and marketplace activity.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>This will create:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Test users (homeowners and handwerkers)</li>
                  <li>Verified handwerker profiles with detailed descriptions</li>
                  <li>Sample leads across all categories</li>
                  <li>Lead purchases and conversations</li>
                  <li>Reviews and ratings</li>
                </ul>
              </div>
              
              <Button 
                onClick={handlePopulateData}
                disabled={isPopulating}
                className="w-full"
              >
                {isPopulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Populating data...
                  </>
                ) : (
                  'Populate Test Data'
                )}
              </Button>
              
              {results && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Users: {results.users?.length || 0}
                      </Badge>
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Handwerkers: {results.handwerkerProfiles?.length || 0}
                      </Badge>
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Leads: {results.leads?.length || 0}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Purchases: {results.purchases?.length || 0}
                      </Badge>
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Conversations: {results.conversations?.length || 0}
                      </Badge>
                      <Badge variant="outline" className="w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Reviews: {results.reviews?.length || 0}
                      </Badge>
                    </div>
                  </div>
                  
                  {results.errors && results.errors.length > 0 && (
                    <div className="space-y-2">
                      <Badge variant="destructive" className="w-full justify-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        Errors: {results.errors.length}
                      </Badge>
                      <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                        {results.errors.map((error: string, index: number) => (
                          <div key={index} className="text-red-600">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center text-sm text-green-600">
                    ✅ Data population completed! You can now test the search functionality.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}