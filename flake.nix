{
  description = "Hermy HQ — Hermes mission control dashboard (Next.js 16 standalone, Nix build)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Source filter: exclude build artifacts + heavy/irrelevant dirs
        # (path: literals ignore .gitignore; filter explicitly).
        filterSource = { dir, ignore }: builtins.path {
          path = dir;
          name = "source";
          filter = (path: type: let base = baseNameOf path; in !(builtins.elem base ignore));
        };
        src = filterSource {
          dir = ./.;
          ignore = [ ".next" "node_modules" "src-tauri" "data" "hermes-bridge" "scanner" ".git" ];
        };

        nodejs = pkgs.nodejs_22;

        npmInstall = ''
          export HOME=$TMPDIR/home
          export npm_config_cache=$TMPDIR/npm-cache
          mkdir -p $npm_config_cache

          # SSL/TLS certs (Nix sandbox lacks system CA bundle)
          export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          export NODE_EXTRA_CA_CERTS=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          export GIT_SSL_CAINFO=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          export NIX_SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt

          # prisma needs openssl at runtime for its engine
          export CPPFLAGS="-I${pkgs.lib.getDev pkgs.openssl}/include"
          export LDFLAGS="-L${pkgs.lib.getLib pkgs.openssl}/lib"

          npm ci --ignore-scripts 2>&1
          # prisma generate (postinstall normally, but --ignore-scripts skipped it)
          npx prisma generate 2>&1
        '';

        hermyhq = pkgs.stdenv.mkDerivation {
          pname = "hermyhq";
          version = "1.0.0";

          src = src;

          nativeBuildInputs = [ nodejs pkgs.cacert ];

          buildPhase = npmInstall + ''
            echo "=== Building Next.js SSR (standalone) ==="
            export NEXT_TELEMETRY_DISABLED=1
            # NEXT_PUBLIC_ is baked at build time — the dashboard shows the owner name
            export NEXT_PUBLIC_OWNER_NAME="''${NEXT_PUBLIC_OWNER_NAME:-MythEclipse}"
            npx next build 2>&1
          '';

          installPhase = ''
            echo "=== Packaging standalone server ==="
            mkdir -p $out/lib/hermyhq/standalone
            cp -r .next/standalone/. $out/lib/hermyhq/standalone/
            mkdir -p $out/lib/hermyhq/standalone/.next
            cp -r .next/static $out/lib/hermyhq/standalone/.next/static
            cp -r public $out/lib/hermyhq/standalone/public 2>/dev/null || true

            # Remove dangling symlinks (pnpm/npm hoisted layout)
            find $out/lib/hermyhq/standalone -type l \
              ! -exec test -e {} \; -delete 2>/dev/null || true

            mkdir -p $out/bin
            printf '%s\n' \
              "#!${pkgs.runtimeShell}" \
              "cd $out/lib/hermyhq/standalone" \
              "export HOSTNAME=127.0.0.1" \
              "exec ${nodejs}/bin/node server.js" > $out/bin/hermyhq
            chmod +x $out/bin/hermyhq
          '';

          meta = {
            description = "Hermy HQ — Next.js 16 mission-control dashboard";
            platforms = pkgs.lib.platforms.linux;
          };
        };

      in {
        packages = {
          inherit hermyhq;
          default = hermyhq;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [ nodejs pkgs.cacert ];
          shellHook = ''
            echo "Hermy HQ dev shell ready — node $(node --version)"
          '';
        };
      });
}
