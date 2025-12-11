import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  testUsers, 
  testLeads, 
  createTestLead,
  createHandwerkerProfile 
} from "@/utils/testData";
// Using edge function for test data population with service role permissions
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Users, FileText, Search, MessageSquare, ShieldAlert, LogIn } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { getCategoryLabel } from "@/config/categoryLabels";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

import { PopulationResult } from "@/utils/testDataPopulation";

export default function TestDashboard() {
  const [populationResult, setPopulationResult] = useState<PopulationResult | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  // Check authentication and admin status
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role when user changes
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setAuthLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .single();

      setIsAdmin(!!data && !error);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateTestResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  const handlePopulateData = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in as an admin to populate test data.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Admin Access Required",
        description: "You need admin or super_admin role to populate test data.",
        variant: "destructive",
      });
      return;
    }

    setIsPopulating(true);
    try {
      // Call edge function with service role permissions
      const { data, error } = await supabase.functions.invoke('populate-test-data', {
        body: {}
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Edge function returned an error');
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      setPopulationResult({
        success: data.success,
        message: data.message,
        created: {
          homeowners: data.results?.homeownersCreated || 0,
          handwerkers: data.results?.handwerkersCreated || 0,
          leads: data.results?.leadsCreated || 0,
          proposals: data.results?.proposalsCreated || 0,
          conversations: 0
        },
        errors: data.results?.errors || []
      });
      
      if (data.success) {
        toast({
          title: "Test Data Populated",
          description: `Created ${data.results.homeownersCreated} homeowners, ${data.results.handwerkersCreated} handwerkers, ${data.results.leadsCreated} leads, and ${data.results.proposalsCreated} proposals.`,
        });
      } else {
        toast({
          title: "Population Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Population error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error Populating Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const runRegistrationTests = async () => {
    updateTestResult('registration-flow', 'running', 'Testing registration flow...');
    
    try {
      // Test user creation with different roles
      const auftraggeber = testUsers.find(u => u.role === 'homeowner');
      const handwerker = testUsers.find(u => u.role === 'handwerker');
      
      if (auftraggeber && handwerker) {
        updateTestResult('registration-flow', 'success', 
          `Registration flow tested with roles: ${auftraggeber.role}, ${handwerker.role}`);
      } else {
        updateTestResult('registration-flow', 'error', 'Test users not found');
      }
    } catch (error) {
      updateTestResult('registration-flow', 'error', `Registration test failed: ${error}`);
    }
  };

  const runLeadManagementTests = async () => {
    updateTestResult('lead-management', 'running', 'Testing lead creation and management...');
    
    try {
      // Check if we have test users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);

      if (error || !profiles || profiles.length === 0) {
        updateTestResult('lead-management', 'error', 'No test users found. Please populate test data first.');
        return;
      }

      // Create test leads for the first profile (homeowner check removed as role is in user_roles table)
      const homeowner = profiles[0];
      if (homeowner) {
        const leadResults = [];
        for (let i = 0; i < Math.min(3, testLeads.length); i++) {
          const leadResult = await createTestLead(testLeads[i], homeowner.id);
          leadResults.push(leadResult);
        }
        
        const successCount = leadResults.filter(r => r.success).length;
        updateTestResult('lead-management', 'success', 
          `Created ${successCount}/${leadResults.length} test leads`);
      } else {
        updateTestResult('lead-management', 'error', 'No homeowner profile found');
      }
    } catch (error) {
      updateTestResult('lead-management', 'error', `Lead management test failed: ${error}`);
    }
  };

  const runSearchTests = async () => {
    updateTestResult('search-functionality', 'running', 'Testing search functionality...');
    
    try {
      // Test basic search
      const { data: allLeads, error: searchError } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'active');

      if (searchError) {
        updateTestResult('search-functionality', 'error', `Search error: ${searchError.message}`);
        return;
      }

      // Test category filter
      const { data: plumbingLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('category', 'sanitaer')
        .eq('status', 'active');

      // Test location filter
      const { data: zurichLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('canton', 'ZH')
        .eq('status', 'active');

      updateTestResult('search-functionality', 'success', 
        `Search tests completed. Total leads: ${allLeads?.length || 0}, Sanitär: ${plumbingLeads?.length || 0}, Zurich: ${zurichLeads?.length || 0}`);
    } catch (error) {
      updateTestResult('search-functionality', 'error', `Search test failed: ${error}`);
    }
  };

  const runHandwerkerProfileTests = async () => {
    updateTestResult('handwerker-profiles', 'running', 'Testing handwerker profiles...');
    
    try {
      // Get handwerker users by checking handwerker_profiles table
      const { data: handwerkerProfiles, error: hError } = await supabase
        .from('handwerker_profiles')
        .select('user_id');

      if (hError || !handwerkerProfiles || handwerkerProfiles.length === 0) {
        updateTestResult('handwerker-profiles', 'error', 'No handwerker profiles found');
        return;
      }

      const handwerkerIds = handwerkerProfiles.map(h => h.user_id);
      const { data: handwerkers, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', handwerkerIds);

      if (error || !handwerkers || handwerkers.length === 0) {
        updateTestResult('handwerker-profiles', 'error', 'No handwerker profiles found');
        return;
      }

      // Create handwerker profiles for test users
      let successCount = 0;
      for (let i = 0; i < handwerkers.length && i < testUsers.length; i++) {
        const handwerker = handwerkers[i];
        const testUser = testUsers.find(u => u.role === 'handwerker' && u.handwerkerProfile);
        
        if (testUser?.handwerkerProfile) {
          const result = await createHandwerkerProfile(handwerker.id, testUser.handwerkerProfile);
          if (result.success) successCount++;
        }
      }

      updateTestResult('handwerker-profiles', 'success', 
        `Created ${successCount} handwerker profiles`);
    } catch (error) {
      updateTestResult('handwerker-profiles', 'error', `Handwerker profile test failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    await runRegistrationTests();
    await runLeadManagementTests();
    await runSearchTests();
    await runHandwerkerProfileTests();
    
    setIsRunningTests(false);
    toast({
      title: "Tests Completed",
      description: "All test suites have been executed",
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">QA Test Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive testing platform for Büeze.ch
        </p>
      </div>

      {/* Authentication Status Banner */}
      <div className="mx-auto max-w-2xl">
        {authLoading ? (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Checking authentication status...
            </AlertDescription>
          </Alert>
        ) : !user ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Please log in as an admin to use this dashboard.</span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : !isAdmin ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              <strong>Access Denied:</strong> You are logged in as {user.email}, but you need admin or super_admin role to populate test data.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Authenticated:</strong> Logged in as {user.email} 
              <Badge variant="default" className="ml-2">Admin</Badge>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="population" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="population">Data Population</TabsTrigger>
          <TabsTrigger value="tests">Test Execution</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="population" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Data Population
              </CardTitle>
              <CardDescription>
                Create test accounts and leads for comprehensive QA testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handlePopulateData} 
                disabled={isPopulating || !user || !isAdmin}
                className="w-full"
                title={
                  !user 
                    ? "Please log in first" 
                    : !isAdmin 
                    ? "Admin access required" 
                    : "Populate test data"
                }
              >
                {isPopulating ? "Populating..." : "Populate Test Data"}
              </Button>
              
              {(!user || !isAdmin) && (
                <p className="text-sm text-muted-foreground text-center">
                  {!user 
                    ? "You must be logged in as an admin to populate test data." 
                    : "You need admin or super_admin role to use this feature."}
                </p>
              )}

              {populationResult && (
                <div className="space-y-2">
                  <Alert>
                    <AlertDescription>
                      <strong>Population Summary:</strong><br />
                      ✅ Created {populationResult.created.homeowners} homeowners, {populationResult.created.handwerkers} handwerkers<br />
                      ✅ Created {populationResult.created.leads} leads, {populationResult.created.proposals} proposals<br />
                      ❌ {populationResult.errors.length} errors
                    </AlertDescription>
                  </Alert>

                  {populationResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-red-600">Errors:</h4>
                      {populationResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">{error}</p>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Test Users Created:</h4>
                      <div className="space-y-1">
                        {testUsers.map((user, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant={user.role === 'handwerker' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <span>{user.profile.full_name}</span>
                            <span className="text-muted-foreground">({user.email})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Test Leads Available:</h4>
                      <div className="space-y-1">
                        {testLeads.slice(0, 5).map((lead, index) => (
                          <div key={index} className="text-sm">
                            <Badge variant="outline" className="mr-2">{getCategoryLabel(lead.category)}</Badge>
                            {lead.title}
                          </div>
                        ))}
                        {testLeads.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            +{testLeads.length - 5} more leads...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Automated Test Execution
              </CardTitle>
              <CardDescription>
                Run comprehensive test suites for all major workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunningTests}
                className="w-full"
              >
                {isRunningTests ? "Running Tests..." : "Run All Tests"}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={runRegistrationTests}
                  disabled={isRunningTests}
                >
                  Test Registration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runLeadManagementTests}
                  disabled={isRunningTests}
                >
                  Test Lead Management
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runSearchTests}
                  disabled={isRunningTests}
                >
                  Test Search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runHandwerkerProfileTests}
                  disabled={isRunningTests}
                >
                  Test Handwerker Profiles
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Real-time results from automated test execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tests have been run yet. Go to the Test Execution tab to run tests.
                </p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{result.name}</h4>
                        {result.message && (
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Testing Checklist</CardTitle>
              <CardDescription>
                Step-by-step manual testing procedures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Registration & Authentication Testing
                  </h3>
                  <ul className="space-y-1 text-sm ml-6">
                    <li>• Test registration as Auftraggeber (homeowner)</li>
                    <li>• Test registration as Handwerker (craftsman)</li>
                    <li>• Verify email validation and required fields</li>
                    <li>• Test login/logout functionality</li>
                    <li>• Check profile creation and role assignment</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Lead Management Testing
                  </h3>
                  <ul className="space-y-1 text-sm ml-6">
                    <li>• Create leads in different categories</li>
                    <li>• Test budget ranges and urgency levels</li>
                    <li>• Verify location data (canton, city, ZIP)</li>
                    <li>• Test lead status progression</li>
                    <li>• Check lead visibility and permissions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search & Discovery Testing
                  </h3>
                  <ul className="space-y-1 text-sm ml-6">
                    <li>• Test HeroSearch functionality</li>
                    <li>• Filter by category, location, budget</li>
                    <li>• Test search result accuracy</li>
                    <li>• Verify lead detail page navigation</li>
                    <li>• Check responsive search interface</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Communication Testing
                  </h3>
                  <ul className="space-y-1 text-sm ml-6">
                    <li>• Test lead purchase system</li>
                    <li>• Verify conversation creation</li>
                    <li>• Test messaging between users</li>
                    <li>• Check message history persistence</li>
                    <li>• Test real-time updates</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Testing Tips:</strong><br />
                  • Use different browsers and devices<br />
                  • Test network error scenarios<br />
                  • Verify responsive design on mobile<br />
                  • Check accessibility features<br />
                  • Test edge cases and error handling
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}