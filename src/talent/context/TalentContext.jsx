import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

const TalentContext =
  createContext(null);

export function TalentProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    let mounted = true;

    const loadTalent = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: {
            user: currentUser,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }

          return;
        }

        if (mounted) {
          setUser(currentUser);
        }

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        /*
         * This context is specifically for
         * the Talent section.
         *
         * A user with another role should
         * not be treated as a Talent.
         */

        if (
          profileData.role !==
          "talent"
        ) {
          if (mounted) {
            setProfile(null);
            setError(
              "This account is not a talent account."
            );
          }

          return;
        }

        if (mounted) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error(
          "Failed to load talent profile:",
          err
        );

        if (mounted) {
          setError(
            err.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTalent();

    /*
     * Keep the Talent section synchronized
     * with Supabase authentication.
     */

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (!mounted) return;

          if (
            event ===
              "SIGNED_OUT" ||
            !session?.user
          ) {
            setUser(null);
            setProfile(null);
            return;
          }

          setUser(session.user);

          /*
           * Give Supabase a moment after
           * authentication before querying
           * the profile.
           */
          setTimeout(
            async () => {
              if (!mounted) return;

              const {
                data,
                error:
                  profileError,
              } =
                await supabase
                  .from(
                    "profiles"
                  )
                  .select("*")
                  .eq(
                    "id",
                    session.user.id
                  )
                  .single();

              if (
                profileError
              ) {
                console.error(
                  "Profile refresh error:",
                  profileError
                );

                return;
              }

              if (
                mounted
              ) {
                setProfile(data);
              }
            },
            0
          );
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  /*
   * Calculate profile completion
   * from the actual profile.
   */

  const profileCompletion =
    useMemo(() => {
      if (!profile) {
        return 0;
      }

      const fields = [
        profile.full_name,
        profile.username,
        profile.avatar_url,
        profile.bio,
        profile.location,
        profile.phone,
        profile.github_url,
        profile.linkedin_url,
        profile.portfolio_url,
      ];

      const completed =
        fields.filter(
          (field) =>
            field !== null &&
            field !== undefined &&
            String(field).trim() !== ""
        ).length;

      return Math.round(
        (completed /
          fields.length) *
          100
      );
    }, [profile]);


  /*
   * Display name
   */

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.email?.split(
      "@"
    )[0] ||
    "Talent";


  /*
   * First name
   */

  const firstName =
    displayName.split(
      " "
    )[0];


  /*
   * Avatar initials
   */

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (name) =>
          name[0]
            ?.toUpperCase()
      )
      .join("") || "T";


  /*
   * Refresh profile manually.
   */

  const refreshProfile =
    async () => {
      if (!user) return;

      const {
        data,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            user.id
          )
          .single();

      if (
        profileError
      ) {
        console.error(
          "Failed to refresh profile:",
          profileError
        );

        return;
      }

      setProfile(data);
    };


  const value = {
    user,
    profile,

    loading,
    error,

    displayName,
    firstName,
    initials,

    profileCompletion,

    refreshProfile,
  };


  return (
    <TalentContext.Provider
      value={value}
    >
      {children}
    </TalentContext.Provider>
  );
}


/*
 * Custom hook
 */

export function useTalent() {
  const context =
    useContext(
      TalentContext
    );

  if (!context) {
    throw new Error(
      "useTalent must be used inside TalentProvider"
    );
  }

  return context;
}
