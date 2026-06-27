export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			graphql: {
				Args: {
					extensions?: Json
					operationName?: string
					query?: string
					variables?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	public: {
		Tables: {
			calendar_events: {
				Row: {
					competition_id: string
					created_at: string
					event_date: string
					event_type: Database['public']['Enums']['calendar_event_type']
					id: string
					title: string
				}
				Insert: {
					competition_id: string
					created_at?: string
					event_date: string
					event_type: Database['public']['Enums']['calendar_event_type']
					id?: string
					title: string
				}
				Update: {
					competition_id?: string
					created_at?: string
					event_date?: string
					event_type?: Database['public']['Enums']['calendar_event_type']
					id?: string
					title?: string
				}
				Relationships: [
					{
						foreignKeyName: 'calendar_events_competition_id_fkey'
						columns: ['competition_id']
						isOneToOne: false
						referencedRelation: 'competitions'
						referencedColumns: ['id']
					},
				]
			}
			competitions: {
				Row: {
					created_at: string
					created_by: string | null
					drive_computed_at: string | null
					drive_distance_meters: number | null
					drive_distance_text: string | null
					drive_duration_seconds: number | null
					drive_duration_text: string | null
					event_date: string
					id: string
					location: string | null
					location_lat: number | null
					location_lng: number | null
					name: string
					notes: string | null
					origin_location: string | null
					payment_deadline: string
					sign_up_closes: string
					sign_up_opens: string
					sport: Database['public']['Enums']['sport']
					url: string | null
				}
				Insert: {
					created_at?: string
					created_by?: string | null
					drive_computed_at?: string | null
					drive_distance_meters?: number | null
					drive_distance_text?: string | null
					drive_duration_seconds?: number | null
					drive_duration_text?: string | null
					event_date: string
					id?: string
					location?: string | null
					location_lat?: number | null
					location_lng?: number | null
					name: string
					notes?: string | null
					origin_location?: string | null
					payment_deadline: string
					sign_up_closes: string
					sign_up_opens: string
					sport: Database['public']['Enums']['sport']
					url?: string | null
				}
				Update: {
					created_at?: string
					created_by?: string | null
					drive_computed_at?: string | null
					drive_distance_meters?: number | null
					drive_distance_text?: string | null
					drive_duration_seconds?: number | null
					drive_duration_text?: string | null
					event_date?: string
					id?: string
					location?: string | null
					location_lat?: number | null
					location_lng?: number | null
					name?: string
					notes?: string | null
					origin_location?: string | null
					payment_deadline?: string
					sign_up_closes?: string
					sign_up_opens?: string
					sport?: Database['public']['Enums']['sport']
					url?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'competitions_created_by_fkey'
						columns: ['created_by']
						isOneToOne: false
						referencedRelation: 'profiles'
						referencedColumns: ['id']
					},
				]
			}
			dogs: {
				Row: {
					breed: string | null
					created_at: string
					created_by: string | null
					date_of_birth: string | null
					id: string
					name: string
					notes: string | null
					withers_height_cm: number | null
				}
				Insert: {
					breed?: string | null
					created_at?: string
					created_by?: string | null
					date_of_birth?: string | null
					id?: string
					name: string
					notes?: string | null
					withers_height_cm?: number | null
				}
				Update: {
					breed?: string | null
					created_at?: string
					created_by?: string | null
					date_of_birth?: string | null
					id?: string
					name?: string
					notes?: string | null
					withers_height_cm?: number | null
				}
				Relationships: [
					{
						foreignKeyName: 'dogs_created_by_fkey'
						columns: ['created_by']
						isOneToOne: false
						referencedRelation: 'profiles'
						referencedColumns: ['id']
					},
				]
			}
			dog_nosework_diploma_counts: {
				Row: {
					class: Database['public']['Enums']['nosework_class']
					count: number
					dog_id: string
					id: string
					type: Database['public']['Enums']['nosework_type']
				}
				Insert: {
					class: Database['public']['Enums']['nosework_class']
					count?: number
					dog_id: string
					id?: string
					type: Database['public']['Enums']['nosework_type']
				}
				Update: {
					class?: Database['public']['Enums']['nosework_class']
					count?: number
					dog_id?: string
					id?: string
					type?: Database['public']['Enums']['nosework_type']
				}
				Relationships: [
					{
						foreignKeyName: 'dog_nosework_diploma_counts_dog_id_fkey'
						columns: ['dog_id']
						isOneToOne: false
						referencedRelation: 'dogs'
						referencedColumns: ['id']
					},
				]
			}
			dog_rally_qualified_counts: {
				Row: {
					count: number
					dog_id: string
					id: string
					level: Database['public']['Enums']['rally_level']
				}
				Insert: {
					count?: number
					dog_id: string
					id?: string
					level: Database['public']['Enums']['rally_level']
				}
				Update: {
					count?: number
					dog_id?: string
					id?: string
					level?: Database['public']['Enums']['rally_level']
				}
				Relationships: [
					{
						foreignKeyName: 'dog_rally_qualified_counts_dog_id_fkey'
						columns: ['dog_id']
						isOneToOne: false
						referencedRelation: 'dogs'
						referencedColumns: ['id']
					},
				]
			}
			entries: {
				Row: {
					competition_id: string
					created_at: string
					dog_id: string | null
					handler_id: string | null
					id: string
					sport: Database['public']['Enums']['sport']
					status: Database['public']['Enums']['entry_status']
				}
				Insert: {
					competition_id: string
					created_at?: string
					dog_id?: string | null
					handler_id?: string | null
					id?: string
					sport: Database['public']['Enums']['sport']
					status?: Database['public']['Enums']['entry_status']
				}
				Update: {
					competition_id?: string
					created_at?: string
					dog_id?: string | null
					handler_id?: string | null
					id?: string
					sport?: Database['public']['Enums']['sport']
					status?: Database['public']['Enums']['entry_status']
				}
				Relationships: [
					{
						foreignKeyName: 'entries_competition_id_fkey'
						columns: ['competition_id']
						isOneToOne: false
						referencedRelation: 'competitions'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'entries_dog_id_fkey'
						columns: ['dog_id']
						isOneToOne: false
						referencedRelation: 'dogs'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'entries_handler_id_fkey'
						columns: ['handler_id']
						isOneToOne: false
						referencedRelation: 'profiles'
						referencedColumns: ['id']
					},
				]
			}
			nosework_entry_results: {
				Row: {
					diploma_result:
						| Database['public']['Enums']['nosework_diploma_result']
						| null
					entry_id: string
					search_1_placement: Database['public']['Enums']['competition_placement']
					search_2_placement: Database['public']['Enums']['competition_placement']
					search_3_placement: Database['public']['Enums']['competition_placement']
					search_4_placement: Database['public']['Enums']['competition_placement']
					total_placement: Database['public']['Enums']['competition_placement']
				}
				Insert: {
					diploma_result?:
						| Database['public']['Enums']['nosework_diploma_result']
						| null
					entry_id: string
					search_1_placement?: Database['public']['Enums']['competition_placement']
					search_2_placement?: Database['public']['Enums']['competition_placement']
					search_3_placement?: Database['public']['Enums']['competition_placement']
					search_4_placement?: Database['public']['Enums']['competition_placement']
					total_placement?: Database['public']['Enums']['competition_placement']
				}
				Update: {
					diploma_result?:
						| Database['public']['Enums']['nosework_diploma_result']
						| null
					entry_id?: string
					search_1_placement?: Database['public']['Enums']['competition_placement']
					search_2_placement?: Database['public']['Enums']['competition_placement']
					search_3_placement?: Database['public']['Enums']['competition_placement']
					search_4_placement?: Database['public']['Enums']['competition_placement']
					total_placement?: Database['public']['Enums']['competition_placement']
				}
				Relationships: [
					{
						foreignKeyName: 'nosework_entry_results_entry_id_fkey'
						columns: ['entry_id']
						isOneToOne: true
						referencedRelation: 'entries'
						referencedColumns: ['id']
					},
				]
			}
			nosework_details: {
				Row: {
					class: Database['public']['Enums']['nosework_class']
					competition_id: string
					official_status: Database['public']['Enums']['nosework_official_status']
					type: Database['public']['Enums']['nosework_type']
				}
				Insert: {
					class: Database['public']['Enums']['nosework_class']
					competition_id: string
					official_status: Database['public']['Enums']['nosework_official_status']
					type: Database['public']['Enums']['nosework_type']
				}
				Update: {
					class?: Database['public']['Enums']['nosework_class']
					competition_id?: string
					official_status?: Database['public']['Enums']['nosework_official_status']
					type?: Database['public']['Enums']['nosework_type']
				}
				Relationships: [
					{
						foreignKeyName: 'nosework_details_competition_id_fkey'
						columns: ['competition_id']
						isOneToOne: true
						referencedRelation: 'competitions'
						referencedColumns: ['id']
					},
				]
			}
			origin_address_favorites: {
				Row: {
					address: string
					created_at: string
					id: string
					label: string
					sort_order: number
				}
				Insert: {
					address: string
					created_at?: string
					id?: string
					label: string
					sort_order?: number
				}
				Update: {
					address?: string
					created_at?: string
					id?: string
					label?: string
					sort_order?: number
				}
				Relationships: []
			}
			profiles: {
				Row: {
					calendar_emoji: string | null
					email: string
					full_name: string | null
					id: string
					role: Database['public']['Enums']['user_role']
				}
				Insert: {
					calendar_emoji?: string | null
					email: string
					full_name?: string | null
					id: string
					role?: Database['public']['Enums']['user_role']
				}
				Update: {
					calendar_emoji?: string | null
					email?: string
					full_name?: string | null
					id?: string
					role?: Database['public']['Enums']['user_role']
				}
				Relationships: []
			}
			rally_details: {
				Row: {
					competition_id: string
					level: Database['public']['Enums']['rally_level']
					number_of_starts: Database['public']['Enums']['rally_starts']
				}
				Insert: {
					competition_id: string
					level?: Database['public']['Enums']['rally_level']
					number_of_starts: Database['public']['Enums']['rally_starts']
				}
				Update: {
					competition_id?: string
					level?: Database['public']['Enums']['rally_level']
					number_of_starts?: Database['public']['Enums']['rally_starts']
				}
				Relationships: [
					{
						foreignKeyName: 'rally_details_competition_id_fkey'
						columns: ['competition_id']
						isOneToOne: true
						referencedRelation: 'competitions'
						referencedColumns: ['id']
					},
				]
			}
			rally_start_results: {
				Row: {
					entry_id: string
					id: string
					points: number | null
					start_number: number
				}
				Insert: {
					entry_id: string
					id?: string
					points?: number | null
					start_number: number
				}
				Update: {
					entry_id?: string
					id?: string
					points?: number | null
					start_number?: number
				}
				Relationships: [
					{
						foreignKeyName: 'rally_start_results_entry_id_fkey'
						columns: ['entry_id']
						isOneToOne: false
						referencedRelation: 'entries'
						referencedColumns: ['id']
					},
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			calendar_event_type:
				| 'sign_up_open'
				| 'sign_up_close'
				| 'payment'
				| 'event_day'
			competition_placement: 'ingen' | 'place_1' | 'place_2' | 'place_3'
			entry_status:
				| 'interested'
				| 'signed_up'
				| 'slot_assigned'
				| 'reserve_slot'
				| 'paid'
			nosework_class: 'class_1' | 'class_2' | 'class_3' | 'elit'
			nosework_diploma_result: 'inget_diplom' | 'diplom'
			nosework_official_status: 'official' | 'unofficial' | 'summit'
			nosework_type:
				| 'tsm'
				| 'tem_behallare'
				| 'tem_inomhus'
				| 'tem_fordon'
				| 'tem_utomhus'
			rally_level: 'nyborjare' | 'fortsattning' | 'avancerad' | 'mastare'
			rally_starts: 'single' | 'double' | 'triple'
			sport: 'nosework' | 'rally_obedience'
			user_role: 'admin' | 'user'
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
				DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
				DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			calendar_event_type: [
				'sign_up_open',
				'sign_up_close',
				'payment',
				'event_day',
			],
			competition_placement: ['ingen', 'place_1', 'place_2', 'place_3'],
			entry_status: [
				'interested',
				'signed_up',
				'slot_assigned',
				'reserve_slot',
				'paid',
			],
			nosework_class: ['class_1', 'class_2', 'class_3', 'elit'],
			nosework_diploma_result: ['inget_diplom', 'diplom'],
			nosework_official_status: ['official', 'unofficial', 'summit'],
			nosework_type: [
				'tsm',
				'tem_behallare',
				'tem_inomhus',
				'tem_fordon',
				'tem_utomhus',
			],
			rally_level: ['nyborjare', 'fortsattning', 'avancerad', 'mastare'],
			rally_starts: ['single', 'double', 'triple'],
			sport: ['nosework', 'rally_obedience'],
			user_role: ['admin', 'user'],
		},
	},
} as const
