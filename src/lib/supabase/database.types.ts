
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": string,"metadata": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"broker_eligibility": {
                  Row: {
                    "checked_at": string,"eligibility_status": Database["public"]['Enums']["eligibility_status"],"expires_at": string | null,"id": string,"requirement_key": string,"source": Database["public"]['Enums']["eligibility_source"],"source_event_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_at"?: string,"eligibility_status": Database["public"]['Enums']["eligibility_status"],"expires_at"?: string | null,"id"?: string,"requirement_key": string,"source": Database["public"]['Enums']["eligibility_source"],"source_event_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "checked_at"?: string,"eligibility_status"?: Database["public"]['Enums']["eligibility_status"],"expires_at"?: string | null,"id"?: string,"requirement_key"?: string,"source"?: Database["public"]['Enums']["eligibility_source"],"source_event_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "broker_eligibility_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"broker_events": {
                  Row: {
                    "event_id": string,"event_type": string,"id": string,"occurred_at": string | null,"payload_sha256": string,"processed_at": string | null,"received_at": string,"result": string | null,"status": Database["public"]['Enums']["broker_event_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"event_type": string,"id"?: string,"occurred_at"?: string | null,"payload_sha256": string,"processed_at"?: string | null,"received_at"?: string,"result"?: string | null,"status"?: Database["public"]['Enums']["broker_event_status"]
                  }
                  Update: {
                    "event_id"?: string,"event_type"?: string,"id"?: string,"occurred_at"?: string | null,"payload_sha256"?: string,"processed_at"?: string | null,"received_at"?: string,"result"?: string | null,"status"?: Database["public"]['Enums']["broker_event_status"]
                  }
                  Relationships: [
                    
                  ]
                },"certificates": {
                  Row: {
                    "completed_at": string,"course_id": string,"holder_name": string,"id": string,"issued_at": string,"revoked_at": string | null,"revoked_reason": string | null,"user_id": string,"verification_code": string,"workload_hours": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at": string,"course_id": string,"holder_name": string,"id"?: string,"issued_at"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"user_id": string,"verification_code": string,"workload_hours": number
                  }
                  Update: {
                    "completed_at"?: string,"course_id"?: string,"holder_name"?: string,"id"?: string,"issued_at"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"user_id"?: string,"verification_code"?: string,"workload_hours"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "completion_min_watch_ratio": number,"created_at": string,"description": string,"id": string,"is_published": boolean,"slug": string,"thumbnail_url": string | null,"title": string,"updated_at": string,"workload_hours": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completion_min_watch_ratio"?: number,"created_at"?: string,"description"?: string,"id"?: string,"is_published"?: boolean,"slug": string,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string,"workload_hours"?: number
                  }
                  Update: {
                    "completion_min_watch_ratio"?: number,"created_at"?: string,"description"?: string,"id"?: string,"is_published"?: boolean,"slug"?: string,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string,"workload_hours"?: number
                  }
                  Relationships: [
                    
                  ]
                },"lesson_progress": {
                  Row: {
                    "completed_at": string | null,"id": string,"last_heartbeat_at": string,"last_position_seconds": number,"lesson_id": string,"started_at": string,"status": Database["public"]['Enums']["lesson_progress_status"],"updated_at": string,"user_id": string,"watched_seconds": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"id"?: string,"last_heartbeat_at"?: string,"last_position_seconds"?: number,"lesson_id": string,"started_at"?: string,"status"?: Database["public"]['Enums']["lesson_progress_status"],"updated_at"?: string,"user_id": string,"watched_seconds"?: number
                  }
                  Update: {
                    "completed_at"?: string | null,"id"?: string,"last_heartbeat_at"?: string,"last_position_seconds"?: number,"lesson_id"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["lesson_progress_status"],"updated_at"?: string,"user_id"?: string,"watched_seconds"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_progress_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "created_at": string,"description": string,"duration_seconds": number,"id": string,"is_published": boolean,"is_required": boolean,"materials": NonNullable<Json>,"module_id": string,"objectives": (string)[],"position": number,"thumbnail_url": string | null,"title": string,"topics": (string)[],"updated_at": string,"video_asset_id": string | null,"video_provider": Database["public"]['Enums']["video_provider"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"duration_seconds"?: number,"id"?: string,"is_published"?: boolean,"is_required"?: boolean,"materials"?: NonNullable<Json>,"module_id": string,"objectives"?: (string)[],"position": number,"thumbnail_url"?: string | null,"title": string,"topics"?: (string)[],"updated_at"?: string,"video_asset_id"?: string | null,"video_provider"?: Database["public"]['Enums']["video_provider"]
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"duration_seconds"?: number,"id"?: string,"is_published"?: boolean,"is_required"?: boolean,"materials"?: NonNullable<Json>,"module_id"?: string,"objectives"?: (string)[],"position"?: number,"thumbnail_url"?: string | null,"title"?: string,"topics"?: (string)[],"updated_at"?: string,"video_asset_id"?: string | null,"video_provider"?: Database["public"]['Enums']["video_provider"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    }
                  ]
                },"module_access": {
                  Row: {
                    "created_at": string,"expires_at": string | null,"granted_by": string | null,"id": string,"module_id": string,"reason": string,"source": string,"status": Database["public"]['Enums']["module_access_status"],"updated_at": string,"user_id": string,"verified_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string | null,"granted_by"?: string | null,"id"?: string,"module_id": string,"reason": string,"source"?: string,"status": Database["public"]['Enums']["module_access_status"],"updated_at"?: string,"user_id": string,"verified_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string | null,"granted_by"?: string | null,"id"?: string,"module_id"?: string,"reason"?: string,"source"?: string,"status"?: Database["public"]['Enums']["module_access_status"],"updated_at"?: string,"user_id"?: string,"verified_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "module_access_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "module_access_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "module_access_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"module_requirements": {
                  Row: {
                    "config_json": NonNullable<Json>,"created_at": string,"id": string,"module_id": string,"requirement_type": Database["public"]['Enums']["requirement_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "config_json"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"module_id": string,"requirement_type": Database["public"]['Enums']["requirement_type"],"updated_at"?: string
                  }
                  Update: {
                    "config_json"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"module_id"?: string,"requirement_type"?: Database["public"]['Enums']["requirement_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "module_requirements_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    }
                  ]
                },"modules": {
                  Row: {
                    "course_id": string,"created_at": string,"description": string,"id": string,"is_published": boolean,"position": number,"slug": string,"title": string,"topics": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"description"?: string,"id"?: string,"is_published"?: boolean,"position": number,"slug": string,"title": string,"topics"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"is_published"?: boolean,"position"?: number,"slug"?: string,"title"?: string,"topics"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "modules_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "auth_user_id": string,"broker_account_status": string | null,"broker_last_synced_at": string | null,"broker_linked_at": string | null,"broker_registered_at": string | null,"broker_user_id": string | null,"broker_verification_status": string | null,"created_at": string,"email": string,"full_name": string,"id": string,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_user_id": string,"broker_account_status"?: string | null,"broker_last_synced_at"?: string | null,"broker_linked_at"?: string | null,"broker_registered_at"?: string | null,"broker_user_id"?: string | null,"broker_verification_status"?: string | null,"created_at"?: string,"email": string,"full_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "auth_user_id"?: string,"broker_account_status"?: string | null,"broker_last_synced_at"?: string | null,"broker_linked_at"?: string | null,"broker_registered_at"?: string | null,"broker_user_id"?: string | null,"broker_verification_status"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits": number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "apply_lesson_heartbeat":
{ Args: { "p_claimed_seconds": number,"p_lesson_id": string,"p_position": number,"p_user_id": string }; Returns: {
              "completed_at": string | null,
"id": string,
"last_heartbeat_at": string,
"last_position_seconds": number,
"lesson_id": string,
"started_at": string,
"status": Database["public"]['Enums']["lesson_progress_status"],
"updated_at": string,
"user_id": string,
"watched_seconds": number
            }
                          SetofOptions: {
        from: "*"
        to: "lesson_progress"
        isOneToOne: true
        isSetofReturn: false
      } },
"complete_lesson":
{ Args: { "p_lesson_id": string,"p_user_id": string }; Returns: Json
                           },
"consume_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"current_profile_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"move_lesson":
{ Args: { "p_direction": number,"p_lesson_id": string }; Returns: boolean
                           },
"move_module":
{ Args: { "p_direction": number,"p_module_id": string }; Returns: boolean
                           },
"public_catalog":
{ Args: { "p_course_slug": string }; Returns: {
              "description": string,"lesson_count": number,"module_id": string,"position": number,"slug": string,"title": string,"topics": (string)[],"total_duration_seconds": number
            }[]
                           },
"verify_certificate":
{ Args: { "p_code": string }; Returns: {
              "completed_at": string,"course_title": string,"holder_name": string,"is_revoked": boolean,"issued_at": string,"workload_hours": number
            }[]
                           }
          }
          Enums: {
            "app_role": "student"|"admin","broker_event_status": "processing"|"processed"|"ignored"|"failed","eligibility_source": "webhook"|"api"|"mock","eligibility_status": "eligible"|"not_eligible"|"pending","lesson_progress_status": "in_progress"|"completed","module_access_status": "granted"|"revoked","requirement_type": "FREE"|"PREVIOUS_MODULE"|"BROKER_ELIGIBILITY"|"MANUAL"|"COMBINED","video_provider": "supabase_storage"|"external_url"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["student", "admin"],"broker_event_status": ["processing", "processed", "ignored", "failed"],"eligibility_source": ["webhook", "api", "mock"],"eligibility_status": ["eligible", "not_eligible", "pending"],"lesson_progress_status": ["in_progress", "completed"],"module_access_status": ["granted", "revoked"],"requirement_type": ["FREE", "PREVIOUS_MODULE", "BROKER_ELIGIBILITY", "MANUAL", "COMBINED"],"video_provider": ["supabase_storage", "external_url"]
          }
        }
} as const
