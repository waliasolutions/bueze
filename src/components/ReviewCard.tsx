 import { useState } from "react";
 import { useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useToast } from "@/hooks/use-toast";
 import { Star, MessageSquare, Send, User, Calendar, Eye, EyeOff, Trash2 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { StarRating } from "@/components/ui/star-rating";
 import { invalidateReviewQueries } from "@/lib/queryInvalidation";
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
 import type { ReviewForAdmin, ReviewForHandwerker } from "@/types/entities";
 
 // Union type for both admin and handwerker review formats
 export type ReviewCardData = ReviewForAdmin | ReviewForHandwerker;
 
 interface ReviewCardProps {
   review: ReviewCardData;
   onReviewUpdated: () => void;
   canRespond?: boolean;
   showAdminActions?: boolean;
 }
 
 // Type guards to check review format
 const isAdminReview = (review: ReviewCardData): review is ReviewForAdmin => {
   return 'reviewer' in review && review.reviewer !== undefined && 'email' in (review.reviewer || {});
 };
 
 export const ReviewCard = ({ 
   review, 
   onReviewUpdated, 
   canRespond = false,
   showAdminActions = false 
 }: ReviewCardProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [isResponding, setIsResponding] = useState(false);
   const [responseText, setResponseText] = useState(review.handwerker_response || "");
   const [submitting, setSubmitting] = useState(false);
 
   // Extract reviewer name based on review type
   const getReviewerName = (): string => {
     if (isAdminReview(review)) {
       return review.reviewer?.full_name || 'Unbekannt';
     }
     // For handwerker view, show full name (business relationship exists)
     return review.profiles?.full_name || review.profiles?.first_name || 'Kunde';
   };
 
   // Extract project title based on review type
   const getProjectTitle = (): string => {
     if (isAdminReview(review)) {
       return review.lead?.title || 'Projekt';
     }
     return review.leads?.title || 'Projekt';
   };
 
   // Extract handwerker name for admin view
   const getHandwerkerName = (): string | null => {
     if (isAdminReview(review) && review.handwerker) {
       return review.handwerker.company_name || 
         `${review.handwerker.first_name} ${review.handwerker.last_name}`.trim();
     }
     return null;
   };
 
   const handleSubmitResponse = async () => {
     if (!responseText.trim()) {
       toast({
         title: "Fehler",
         description: "Bitte geben Sie eine Antwort ein.",
         variant: "destructive",
       });
       return;
     }
 
     setSubmitting(true);
     try {
       const { error } = await supabase
         .from('reviews')
         .update({
           handwerker_response: responseText.trim(),
           response_at: new Date().toISOString(),
         })
         .eq('id', review.id);
 
       if (error) throw error;
 
       await invalidateReviewQueries(queryClient, review.reviewed_id);
 
       toast({
         title: "Antwort gespeichert",
         description: "Die Antwort wurde erfolgreich veröffentlicht.",
       });
 
       setIsResponding(false);
       onReviewUpdated();
     } catch (error) {
       console.error("Error submitting response:", error);
       toast({
         title: "Fehler",
         description: "Antwort konnte nicht gespeichert werden.",
         variant: "destructive",
       });
     } finally {
       setSubmitting(false);
     }
   };
 
   const toggleVisibility = async () => {
     try {
       const { error } = await supabase
         .from('reviews')
         .update({ is_public: !review.is_public })
         .eq('id', review.id);
 
       if (error) throw error;
 
       await invalidateReviewQueries(queryClient, review.reviewed_id);
 
       toast({
         title: "Erfolg",
         description: `Bewertung ist jetzt ${!review.is_public ? 'öffentlich' : 'versteckt'}.`,
       });
 
       onReviewUpdated();
     } catch (error) {
       console.error("Error toggling visibility:", error);
       toast({
         title: "Fehler",
         description: "Status konnte nicht geändert werden.",
         variant: "destructive",
       });
     }
   };
 
   const deleteReview = async () => {
     try {
       const { error } = await supabase
         .from('reviews')
         .delete()
         .eq('id', review.id);
 
       if (error) throw error;
 
       await invalidateReviewQueries(queryClient, review.reviewed_id);
 
       toast({
         title: "Erfolg",
         description: "Bewertung wurde gelöscht.",
       });
 
       onReviewUpdated();
     } catch (error) {
       console.error("Error deleting review:", error);
       toast({
         title: "Fehler",
         description: "Bewertung konnte nicht gelöscht werden.",
         variant: "destructive",
       });
     }
   };
 
   const reviewerName = getReviewerName();
   const projectTitle = getProjectTitle();
   const handwerkerName = getHandwerkerName();
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-start justify-between">
           <div>
             <div className="flex items-center gap-2 mb-1">
               <StarRating rating={review.rating} size="sm" />
               <Badge variant="outline" className="text-xs">
                 {review.rating}/5
               </Badge>
               {review.is_public === false && (
                 <Badge variant="secondary" className="text-xs">Versteckt</Badge>
               )}
             </div>
             {review.title && (
               <CardTitle className="text-base">{review.title}</CardTitle>
             )}
           </div>
           <div className="text-right text-sm text-muted-foreground">
             <div className="flex items-center gap-1">
               <User className="h-3 w-3" />
               {reviewerName}
             </div>
             <div className="flex items-center gap-1">
               <Calendar className="h-3 w-3" />
               {format(new Date(review.created_at), "dd. MMM yyyy", { locale: de })}
             </div>
           </div>
         </div>
         <div className="text-xs text-muted-foreground space-y-0.5">
           <p>Projekt: {projectTitle}</p>
           {handwerkerName && <p>Handwerker: {handwerkerName}</p>}
         </div>
       </CardHeader>
       
       <CardContent className="space-y-4">
         {/* Customer Comment */}
         {review.comment && (
           <div className="bg-muted/50 rounded-lg p-3">
             <p className="text-sm">{review.comment}</p>
           </div>
         )}
 
         {/* Handwerker Response */}
         {review.handwerker_response && !isResponding ? (
           <div className="border-l-2 border-primary pl-4">
             <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
               <MessageSquare className="h-4 w-4" />
               Antwort
               {review.response_at && (
                 <span className="text-xs text-muted-foreground font-normal">
                   • {format(new Date(review.response_at), "dd. MMM yyyy", { locale: de })}
                 </span>
               )}
             </div>
             <p className="text-sm text-muted-foreground">{review.handwerker_response}</p>
             {canRespond && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="mt-2"
                 onClick={() => setIsResponding(true)}
               >
                 Antwort bearbeiten
               </Button>
             )}
           </div>
         ) : isResponding || (canRespond && !review.handwerker_response) ? (
           <div className="space-y-3">
             {!isResponding && !review.handwerker_response && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setIsResponding(true)}
               >
                 <MessageSquare className="h-4 w-4 mr-1" />
                 Antworten
               </Button>
             )}
             {isResponding && (
               <>
                 <Textarea
                   placeholder="Schreiben Sie eine professionelle Antwort auf diese Bewertung..."
                   value={responseText}
                   onChange={(e) => setResponseText(e.target.value)}
                   rows={3}
                 />
                 <div className="flex gap-2">
                   <Button
                     size="sm"
                     onClick={handleSubmitResponse}
                     disabled={submitting || !responseText.trim()}
                   >
                     <Send className="h-4 w-4 mr-1" />
                     {submitting ? "Senden..." : "Antwort speichern"}
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => {
                       setIsResponding(false);
                       setResponseText(review.handwerker_response || "");
                     }}
                   >
                     Abbrechen
                   </Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Tipp: Eine freundliche und professionelle Antwort zeigt Engagement.
                 </p>
               </>
             )}
           </div>
         ) : null}
 
         {/* Admin Actions */}
         {showAdminActions && (
           <div className="flex items-center gap-2 pt-2 border-t">
             <Button
               variant="outline"
               size="sm"
               onClick={toggleVisibility}
             >
               {review.is_public ? (
                 <>
                   <EyeOff className="h-4 w-4 mr-1" />
                   Verstecken
                 </>
               ) : (
                 <>
                   <Eye className="h-4 w-4 mr-1" />
                   Öffentlich machen
                 </>
               )}
             </Button>
             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button variant="outline" size="sm" className="text-destructive">
                   <Trash2 className="h-4 w-4 mr-1" />
                   Löschen
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Bewertung löschen?</AlertDialogTitle>
                   <AlertDialogDescription>
                     Diese Aktion kann nicht rückgängig gemacht werden.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                   <AlertDialogAction
                     onClick={deleteReview}
                     className="bg-destructive text-destructive-foreground"
                   >
                     Löschen
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };